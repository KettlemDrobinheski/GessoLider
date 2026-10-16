import assert from 'node:assert/strict';
import test from 'node:test';
import './register-typescript.mjs';
import { documentFixtures } from './budget-document-fixtures.mjs';

const { createSavedBudgetsRepository } = await import('../src/services/saved-budgets.ts');
const { buildSavedBudgetInput, budgetHistoryState, formatBudgetHistoryDate, savedBudgetAmountLabel,
  savedBudgetDetailsRoute, savedBudgetEditRoute, savedBudgetServiceLabels, savedBudgetStatusLabels, saveBudgetRecord } = await import('../src/utils/budget-history.ts');

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

test('prepares an edit route with persisted inputs and only writes after an explicit save', async () => {
  let sequence = 0;
  const repository = createSavedBudgetsRepository(memoryStorage(), {
    createId: () => `edit-${++sequence}`,
    now: () => `2026-10-0${sequence + 1}T10:00:00.000Z`,
  });
  for (const source of sources()) {
    const input = buildSavedBudgetInput(source.service, source.budget, source.pricing, source.company, source.client);
    const saved = await repository.create(input);
    const route = savedBudgetEditRoute(saved);
    assert.equal(route.pathname, '/orcamento/medidas');
    assert.equal(route.params.orcamentoSalvoId, saved.id);
    assert.equal(route.params.servico, saved.service);
    assert.deepEqual(JSON.parse(route.params.orcamento), saved.budget);
    assert.deepEqual(JSON.parse(route.params.valores), saved.pricing);
    assert.deepEqual(JSON.parse(route.params.cliente), saved.client);

    const beforeCancel = await repository.getById(saved.id);
    assert.deepEqual(beforeCancel, saved);

    const editedInput = buildSavedBudgetInput(saved.service, JSON.parse(route.params.orcamento),
      { ...JSON.parse(route.params.valores), notes: 'Editado' }, saved.company, JSON.parse(route.params.cliente));
    const edited = await saveBudgetRecord(repository, editedInput, route.params.orcamentoSalvoId);
    assert.equal(edited.id, saved.id);
    assert.equal(edited.pricing.notes, 'Editado');
    assert.deepEqual(edited.budget, saved.budget);
    assert.deepEqual(edited.company, saved.company);
  }
});
