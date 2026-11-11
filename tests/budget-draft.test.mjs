import assert from 'node:assert/strict';
import test from 'node:test';
import './register-typescript.mjs';
import { documentFixtures } from './budget-document-fixtures.mjs';

const { budgetDraftKey, createSavedBudgetsRepository, savedBudgetsKey } = await import('../src/services/saved-budgets.ts');
const { buildSavedBudgetInput } = await import('../src/utils/budget-history.ts');

function memoryStorage() {
  const entries = new Map();
  return {
    entries,
    async getItem(key) { return entries.get(key) ?? null; },
    async setItem(key, value) { entries.set(key, value); },
    async removeItem(key) { entries.delete(key); },
  };
}

function makeRepository(storage, options = {}) {
  let id = 0;
  let time = 0;
  return createSavedBudgetsRepository(storage, {
    createId: () => options.createId?.() ?? `draft-${++id}`,
    now: () => options.now?.() ?? `2026-11-11T10:00:${String(time++).padStart(2, '0')}.000Z`,
  });
}

test('creates one persistent draft, omits client data from navigation params, and restores it after interruption', async () => {
  const storage = memoryStorage();
  const firstSession = makeRepository(storage);
  const clientDraft = { name: 'Cliente', phone: '', cep: '', street: '', number: '', neighborhood: '', city: '', state: '', complement: '', notes: '' };
  const draft = await firstSession.saveDraft({ route: '/orcamento/cliente', params: { servico: 'wall', cliente: '{"name":"private"}' }, service: 'wall', formData: { clientDraft } });
  const reopened = createSavedBudgetsRepository(storage);
  assert.equal(await reopened.getDraft().then((value) => value.id), draft.id);
  assert.equal((await reopened.getDraft()).route, '/orcamento/cliente');
  assert.equal('cliente' in (await reopened.getDraft()).params, false);
  assert.deepEqual((await reopened.getDraft()).formData.clientDraft, clientDraft);
});

test('autosave updates the same draft and merges data from multiple form steps', async () => {
  const storage = memoryStorage();
  const repository = makeRepository(storage);
  const first = await repository.saveDraft({ route: '/orcamento/medidas', params: { servico: 'wall' }, service: 'wall', formData: { measurements: { dimensions: { length: '4', height: '', width: '', depth: '' }, hasOpenings: false, openings: [] } } });
  const second = await repository.saveDraft({ route: '/orcamento/configuracao-parede', params: { servico: 'wall', parede: '{"length":4}' }, formData: { wallConfiguration: { profileWidth: 70 } } });
  const records = JSON.parse(storage.entries.get(budgetDraftKey));
  assert.equal(second.id, first.id);
  assert.equal(records.id, first.id);
  assert.deepEqual(second.formData, {
    measurements: { dimensions: { length: '4', height: '', width: '', depth: '' }, hasOpenings: false, openings: [] },
    wallConfiguration: { profileWidth: 70 },
  });
  assert.equal(second.route, '/orcamento/configuracao-parede');
});

test('recovers fields from the active stage, including openings and pricing inputs', async () => {
  const storage = memoryStorage();
  const repository = makeRepository(storage);
  const formData = {
    clientDraft: { name: 'Cliente', phone: '', cep: '', street: '', number: '', neighborhood: '', city: '', state: '', complement: '', notes: '' },
    measurements: { dimensions: { length: '5.2', height: '2.8', width: '', depth: '' }, hasOpenings: true,
      openings: [{ id: 'opening-1', type: 'door', width: '0.8', height: '2.1', quantity: '1' }] },
    wallConfiguration: { profileWidth: 70, studSpacingCm: 40 },
    pricingDraft: { laborInput: '50', materialsInput: '900', notes: 'Observação' },
  };
  await repository.saveDraft({ route: '/orcamento/valores', params: { servico: 'wall', orcamento: '{"service":"wall"}' }, service: 'wall', formData });
  const recovered = await createSavedBudgetsRepository(storage).getDraft();
  assert.deepEqual(recovered.formData, formData);
  assert.equal(recovered.params.orcamento, '{"service":"wall"}');
});

test('discards only the matching active draft and leaves saved or finalized budgets untouched', async () => {
  const storage = memoryStorage();
  let id = 0;
  const repository = makeRepository(storage, { createId: () => `record-${++id}` });
  const { company, client, sources } = documentFixtures();
  const source = sources[0];
  const saved = await repository.create(buildSavedBudgetInput(source.service, source.budget, source.pricing, company, client));
  const finalized = await repository.update(saved.id, { status: 'completed' });
  const draft = await repository.saveDraft({ route: '/orcamento/medidas', params: { servico: 'wall' }, service: 'wall' });
  assert.equal(await repository.discardDraft('wrong-id'), false);
  assert.equal(await repository.getDraft().then((value) => value.id), draft.id);
  assert.equal(await repository.discardDraft(draft.id), true);
  assert.equal(await repository.getDraft(), null);
  assert.deepEqual(await repository.getById(saved.id), finalized);
  assert.equal((await repository.list()).length, 1);
  assert.ok(storage.entries.has(savedBudgetsKey));
});

test('serializes concurrent field updates without creating duplicate drafts', async () => {
  const storage = memoryStorage();
  const first = makeRepository(storage);
  const second = createSavedBudgetsRepository(storage);
  await Promise.all([
    first.saveDraft({ route: '/orcamento/medidas', params: { servico: 'ceiling' }, service: 'ceiling', formData: { measurements: { dimensions: { length: '4', height: '', width: '', depth: '' }, hasOpenings: false, openings: [] } } }),
    second.saveDraft({ route: '/orcamento/medidas', params: { servico: 'ceiling', forro: '{"length":4}' }, formData: { measurements: { dimensions: { length: '', height: '', width: '3', depth: '' }, hasOpenings: false, openings: [] } } }),
  ]);
  const draft = await first.getDraft();
  assert.ok(draft.id);
  assert.deepEqual(draft.formData.measurements.dimensions, { length: '', height: '', width: '3', depth: '' });
  assert.equal(JSON.parse(storage.entries.get(budgetDraftKey)).id, draft.id);
});

test('reports storage failures and leaves the previously persisted draft intact', async () => {
  const storage = memoryStorage();
  const repository = makeRepository(storage);
  const original = await repository.saveDraft({ route: '/orcamento/tipo-servico', params: {}, formData: { service: 'wall' } });
  const bytes = storage.entries.get(budgetDraftKey);
  storage.setItem = async () => { throw new Error('write failed'); };
  await assert.rejects(repository.saveDraft({ route: '/orcamento/medidas', params: { servico: 'wall' } }), /write failed/);
  assert.equal(storage.entries.get(budgetDraftKey), bytes);
  storage.removeItem = async () => { throw new Error('remove failed'); };
  await assert.rejects(repository.discardDraft(original.id), /remove failed/);
  assert.equal(storage.entries.get(budgetDraftKey), bytes);
  storage.getItem = async () => { throw new Error('read failed'); };
  await assert.rejects(repository.getDraft(), /read failed/);
  assert.ok(original.id);
});

test('rejects corrupt drafts without replacing their stored bytes', async () => {
  const storage = memoryStorage();
  const invalid = '{';
  storage.entries.set(budgetDraftKey, invalid);
  const repository = createSavedBudgetsRepository(storage);
  await assert.rejects(repository.getDraft(), /corrompido/);
  await assert.rejects(repository.saveDraft({ route: '/orcamento/medidas', params: {} }));
  assert.equal(storage.entries.get(budgetDraftKey), invalid);
  assert.equal(await repository.discardDraft(), true);
  assert.equal(storage.entries.has(budgetDraftKey), false);
});
