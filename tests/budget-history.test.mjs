import assert from 'node:assert/strict';
import test from 'node:test';
import './register-typescript.mjs';
import { documentFixtures } from './budget-document-fixtures.mjs';

const { createSavedBudgetsRepository } = await import('../src/services/saved-budgets.ts');
const { buildSavedBudgetInput, budgetHistoryState, formatBudgetHistoryDate, savedBudgetAmountLabel,
  savedBudgetDetailsRoute, savedBudgetEditRoute, savedBudgetServiceLabels, savedBudgetStatusLabels, saveBudgetRecord } = await import('../src/utils/budget-history.ts');
const { parseWallBudgetInput } = await import('../src/utils/wall-configuration.ts');
const { parseCeilingBudgetInput } = await import('../src/utils/ceiling.ts');
const { parseWoodWallCladdingBudgetInput } = await import('../src/utils/wood-wall-cladding.ts');
const { parseWallPricingInput } = await import('../src/utils/wall-pricing.ts');
const { parseBudgetPricingInput } = await import('../src/utils/budget-pricing.ts');

function memoryStorage() {
  const entries = new Map();
  return { entries, async getItem(key) { return entries.get(key) ?? null; }, async setItem(key, value) { entries.set(key, value); } };
}

function sources() {
  const fixture = documentFixtures();
  return fixture.sources.map((source) => ({ ...source, company: fixture.company, client: fixture.client }));
}

test('builds valid save inputs preserving each service, customer, manual costs and company snapshot', () => {
  const inputs = sources().map((source) => buildSavedBudgetInput(source.service, source.budget, source.pricing, source.company, source.client));
  assert.deepEqual(inputs.map((input) => input?.service), ['wall', 'ceiling', 'lining']);
  assert.deepEqual(inputs.map((input) => input?.client.name), ['João da Silva', 'João da Silva', 'João da Silva']);
  assert.deepEqual(inputs.map((input) => input?.pricing.materialsTotal), [1000, 1000, 1000]);
  assert.deepEqual(inputs.map((input) => input?.company.companyName), ['GessoLider', 'GessoLider', 'GessoLider']);
  assert.deepEqual(inputs[0].budget.measurements.openings, []);
  assert.equal(inputs[1].budget.configuration.spacingCm, 40);
  assert.equal(inputs[2].budget.measurements.width, 4);
  assert.equal(buildSavedBudgetInput('wall', sources()[0].budget, sources()[0].pricing, sources()[0].company, null), null);
});

test('saves all three services and later updates preserve the generated ID', async () => {
  let sequence = 0;
  const storage = memoryStorage();
  const repository = createSavedBudgetsRepository(storage, {
    createId: () => `history-${++sequence}`,
    now: () => `2026-10-0${sequence + 1}T10:00:00.000Z`,
  });
  const records = [];
  for (const source of sources()) {
    const input = buildSavedBudgetInput(source.service, source.budget, source.pricing, source.company, source.client);
    records.push(await saveBudgetRecord(repository, input));
  }
  assert.deepEqual(records.map((record) => record.service), ['wall', 'ceiling', 'lining']);
  for (const record of records) {
    const input = buildSavedBudgetInput(record.service, record.budget, record.pricing, record.company, record.client);
    const updated = await saveBudgetRecord(repository, { ...input, pricing: { ...input.pricing, notes: 'Alteração' } }, record.id);
    assert.equal(updated.id, record.id);
    assert.equal(updated.pricing.notes, 'Alteração');
  }
  assert.equal((await repository.list()).length, 3);
});

test('exposes loading, error, empty and ready list states', () => {
  const record = { id: 'one' };
  assert.equal(budgetHistoryState([], true, null), 'loading');
  assert.equal(budgetHistoryState([], false, 'read failed'), 'error');
  assert.equal(budgetHistoryState([], false, null), 'empty');
  assert.equal(budgetHistoryState([record], false, null), 'ready');
});

test('formats visible history fields and creates details navigation by persisted ID', () => {
  const source = sources()[1];
  const input = buildSavedBudgetInput(source.service, source.budget, source.pricing, source.company, source.client);
  const record = { ...input, schemaVersion: 1, id: 'persisted-id', status: 'approved', createdAt: '2026-10-01T10:00:00.000Z', updatedAt: '2026-10-08T10:00:00.000Z' };
  assert.equal(savedBudgetServiceLabels[record.service], 'Forro de drywall');
  assert.equal(savedBudgetStatusLabels[record.status], 'Aprovado');
  assert.equal(formatBudgetHistoryDate(record.updatedAt), '08/10/2026');
  assert.equal(savedBudgetAmountLabel(record).replace('\u00a0', ' '), 'R$ 2.200,00');
  assert.deepEqual(savedBudgetDetailsRoute(record.id), { pathname: '/orcamentos/[id]', params: { id: 'persisted-id' } });
});

test('opens each saved service with validated inputs and persists edits under the same ID', async () => {
  let sequence = 0;
  const storage = memoryStorage();
  const repository = createSavedBudgetsRepository(storage, {
    createId: () => `edit-${++sequence}`,
    now: () => `2026-10-${String(++sequence).padStart(2, '0')}T10:00:00.000Z`,
  });
  for (const source of sources()) {
    const input = buildSavedBudgetInput(source.service, source.budget, source.pricing, source.company, source.client);
    const saved = await repository.create(input);
    const route = savedBudgetEditRoute(saved);
    assert.equal(route.pathname, '/orcamento/medidas');
    assert.equal(route.params.orcamentoSalvoId, saved.id);
    assert.equal(route.params.servico, saved.service);
    const parsedBudget = source.service === 'wall' ? parseWallBudgetInput(route.params.orcamento)
      : source.service === 'ceiling' ? parseCeilingBudgetInput(route.params.orcamento)
        : parseWoodWallCladdingBudgetInput(route.params.orcamento);
    const parsedPricing = source.service === 'wall' ? parseWallPricingInput(route.params.valores) : parseBudgetPricingInput(route.params.valores);
    assert.deepEqual(parsedBudget, saved.budget);
    assert.deepEqual(parsedPricing, saved.pricing);
    assert.deepEqual(JSON.parse(route.params.cliente), saved.client);

    const beforeCancel = await repository.getById(saved.id);
    assert.deepEqual(beforeCancel, saved);
    const countBeforeEdit = (await repository.list()).length;

    const editedBudget = structuredClone(parsedBudget);
    editedBudget.configuration.wastePercent = 10;
    const editedClient = { ...saved.client, name: 'Cliente atualizado' };
    const editedInput = buildSavedBudgetInput(saved.service, editedBudget,
      { ...parsedPricing, notes: 'Editado' }, { ...saved.company, companyName: 'Perfil atual diferente' }, editedClient);
    const edited = await saveBudgetRecord(repository, editedInput, route.params.orcamentoSalvoId).catch((cause) => {
      throw new Error(`${saved.service} edit failed: ${cause.message}`);
    });
    assert.equal(edited.id, saved.id);
    assert.equal(edited.pricing.notes, 'Editado');
    assert.deepEqual(edited.budget, editedBudget);
    assert.deepEqual(edited.client, editedClient);
    assert.deepEqual(edited.company, saved.company);
    assert.notEqual(edited.updatedAt, saved.updatedAt);

    const reloadedRepository = createSavedBudgetsRepository(storage);
    const reloaded = await reloadedRepository.getById(saved.id);
    assert.deepEqual(reloaded, edited);
    assert.deepEqual((await reloadedRepository.list()).filter((record) => record.id === saved.id), [edited]);
    assert.equal((await reloadedRepository.list()).length, countBeforeEdit);
  }
});

test('keeps the saved record unchanged when an edit is cancelled before saving', async () => {
  const repository = createSavedBudgetsRepository(memoryStorage(), { createId: () => 'cancel-id', now: () => '2026-10-01T10:00:00.000Z' });
  const source = sources()[0];
  const saved = await repository.create(buildSavedBudgetInput(source.service, source.budget, source.pricing, source.company, source.client));
  const route = savedBudgetEditRoute(saved);
  JSON.parse(route.params.orcamento);
  assert.deepEqual(await repository.getById(saved.id), saved);
  assert.equal((await repository.list()).length, 1);
});

test('reports edit write failures without reporting success or creating another record', async () => {
  const repository = createSavedBudgetsRepository(memoryStorage(), { createId: () => 'error-id', now: () => '2026-10-01T10:00:00.000Z' });
  const source = sources()[0];
  const saved = await repository.create(buildSavedBudgetInput(source.service, source.budget, source.pricing, source.company, source.client));
  const failingWriter = {
    create: (...args) => repository.create(...args),
    update: async () => { throw new Error('storage write failed'); },
  };
  const input = buildSavedBudgetInput(saved.service, saved.budget, saved.pricing, saved.company, saved.client);
  await assert.rejects(saveBudgetRecord(failingWriter, input, saved.id), /storage write failed/);
  assert.deepEqual(await repository.getById(saved.id), saved);
  assert.equal((await repository.list()).length, 1);
});
