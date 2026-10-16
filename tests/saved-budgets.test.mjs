import assert from 'node:assert/strict';
import test from 'node:test';
import './register-typescript.mjs';
import { documentFixtures } from './budget-document-fixtures.mjs';

const { createSavedBudgetsRepository, savedBudgetsKey } = await import('../src/services/saved-budgets.ts');
const { validateSavedBudget, duplicateSavedBudget } = await import('../src/utils/saved-budget.ts');

function fixtures() {
  const { company, client, sources } = documentFixtures();
  return sources.map(({ service, budget, pricing }) => ({ service, budget, pricing, company, client }));
}

function memoryStorage() {
  const entries = new Map();
  return {
    entries,
    async getItem(key) { return entries.get(key) ?? null; },
    async setItem(key, value) { entries.set(key, value); },
  };
}

function repository(storage = memoryStorage(), ids = ['id-1', 'id-2', 'id-3'], dates = [
  '2026-10-01T10:00:00.000Z', '2026-10-02T10:00:00.000Z', '2026-10-03T10:00:00.000Z',
]) {
  let idIndex = 0;
  let dateIndex = 0;
  const baseDate = Date.parse('2026-10-10T10:00:00.000Z');
  return createSavedBudgetsRepository(storage, {
    createId: () => ids[idIndex++] ?? `generated-id-${idIndex}`,
    now: () => dates[dateIndex++] ?? new Date(baseDate + dateIndex * 86400000).toISOString(),
  });
}

test('creates, persists and reloads valid records for each service', async () => {
  const storage = memoryStorage();
  const first = repository(storage);
  for (const [index, input] of fixtures().entries()) {
    const saved = await first.create(input);
    assert.equal(saved.service, input.service);
    assert.equal(saved.status, 'draft');
    assert.deepEqual(saved.budget, input.budget);
    assert.deepEqual(saved.client, input.client);
    assert.deepEqual(saved.company, input.company);
    assert.deepEqual(saved.pricing, { laborRate: input.pricing.laborRate, materialsTotal: input.pricing.materialsTotal, notes: input.pricing.notes });
    assert.equal(saved.id, `id-${index + 1}`);
  }
  const reopened = createSavedBudgetsRepository(storage);
  assert.equal((await reopened.list()).length, 3);
  assert.deepEqual(await reopened.getById('id-2'), await first.getById('id-2'));
  assert.ok(storage.entries.has(savedBudgetsKey));
});

test('lists newest updated records first and queries by ID', async () => {
  const repo = repository();
  for (const input of fixtures()) await repo.create(input);
  assert.deepEqual((await repo.list()).map(({ id }) => id), ['id-3', 'id-2', 'id-1']);
  assert.equal((await repo.getById('id-2')).service, 'ceiling');
  assert.equal(await repo.getById('missing'), null);
});

test('updates data and status while preserving ID and creation date', async () => {
  const repo = repository();
  const original = await repo.create(fixtures()[0]);
  const updated = await repo.update(original.id, { status: 'sent', pricing: { ...original.pricing, notes: 'Proposta enviada' } });
  assert.equal(updated.status, 'sent');
  assert.equal(updated.pricing.notes, 'Proposta enviada');
  assert.equal(updated.id, original.id);
  assert.equal(updated.createdAt, original.createdAt);
  assert.notEqual(updated.updatedAt, original.updatedAt);
});

test('deletes only the selected record', async () => {
  const repo = repository();
  await repo.create(fixtures()[0]);
  await repo.create(fixtures()[1]);
  assert.equal(await repo.delete('id-1'), true);
  assert.equal(await repo.delete('id-1'), false);
  assert.deepEqual((await repo.list()).map(({ id }) => id), ['id-2']);
});

test('duplicates as an independent draft with a new ID and dates', async () => {
  const repo = repository();
  const original = await repo.create(fixtures()[0]);
  await repo.update(original.id, { status: 'approved' });
  const duplicate = await repo.duplicate(original.id);
  assert.notEqual(duplicate.id, original.id);
  assert.notEqual(duplicate.createdAt, original.createdAt);
  assert.equal(duplicate.createdAt, duplicate.updatedAt);
  assert.equal(duplicate.status, 'draft');
  assert.deepEqual(duplicate.budget, original.budget);
  await repo.update(duplicate.id, { pricing: { ...duplicate.pricing, notes: 'Somente cópia' } });
  assert.equal((await repo.getById(original.id)).pricing.notes, original.pricing.notes);
  assert.equal((await repo.getById(original.id)).status, 'approved');
});

test('duplicates every service type without changing its original configuration or costs', async () => {
  for (const [index, input] of fixtures().entries()) {
    const storage = memoryStorage();
    const repo = repository(storage, [`original-${index}`, `copy-${index}`], [
      '2026-10-01T10:00:00.000Z', '2026-10-02T10:00:00.000Z', '2026-10-03T10:00:00.000Z',
    ]);
    const original = await repo.create(input);
    const copy = await repo.duplicate(original.id);
    assert.equal(copy.service, original.service);
    assert.notEqual(copy.id, original.id);
    assert.equal(copy.status, 'draft');
    assert.notEqual(copy.createdAt, original.createdAt);
    assert.deepEqual(copy.budget, original.budget);
    assert.deepEqual(copy.pricing, original.pricing);
    assert.deepEqual(copy.client, original.client);
    await repo.update(copy.id, { pricing: { ...copy.pricing, notes: 'Somente na cópia' } });
    assert.deepEqual(await repo.getById(original.id), original);
  }
});

test('validates status, schema, business data, service and timestamps', () => {
  const valid = { ...fixtures()[0], schemaVersion: 1, id: 'valid', createdAt: '2026-10-01T10:00:00.000Z',
    updatedAt: '2026-10-01T10:00:00.000Z', status: 'draft' };
  assert.ok(validateSavedBudget(valid));
  for (const invalid of [
    { ...valid, schemaVersion: 2 }, { ...valid, status: 'unknown' }, { ...valid, id: '' },
    { ...valid, updatedAt: 'invalid' }, { ...valid, service: 'unknown' },
    { ...valid, client: { ...valid.client, name: '' } }, { ...valid, company: { ...valid.company, companyName: '' } },
    { ...valid, pricing: { ...valid.pricing, laborRate: -1 } },
    { ...valid, budget: { ...valid.budget, measurements: { ...valid.budget.measurements, length: -1 } } },
  ]) assert.equal(validateSavedBudget(invalid), null);
  const badDuplicate = duplicateSavedBudget(validateSavedBudget(valid), { id: 'copy', now: '2026-10-02T10:00:00.000Z' });
  assert.equal(badDuplicate.status, 'draft');
});

test('rejects corrupted or unsupported collections without replacing stored bytes', async () => {
  for (const value of ['{', 'null', JSON.stringify({ schemaVersion: 2, records: [] }),
    JSON.stringify({ schemaVersion: 1, records: [{ id: 'broken' }] })]) {
    const storage = memoryStorage();
    storage.entries.set(savedBudgetsKey, value);
    const repo = createSavedBudgetsRepository(storage);
    await assert.rejects(repo.list());
    assert.equal(storage.entries.get(savedBudgetsKey), value);
    await assert.rejects(repo.create(fixtures()[0]));
    assert.equal(storage.entries.get(savedBudgetsKey), value);
  }
});

test('signals read and write failures and keeps the last persisted history intact', async () => {
  const storage = memoryStorage();
  const repo = repository(storage);
  const record = await repo.create(fixtures()[0]);
  const saved = storage.entries.get(savedBudgetsKey);
  storage.setItem = async () => { throw new Error('write failed'); };
  await assert.rejects(repo.update(record.id, { status: 'sent' }), /write failed/);
  assert.equal(storage.entries.get(savedBudgetsKey), saved);
  storage.getItem = async () => { throw new Error('read failed'); };
  await assert.rejects(repo.list(), /read failed/);
  await assert.rejects(repo.delete(record.id), /read failed/);
});

test('serializes concurrent writes from repository instances sharing storage', async () => {
  const storage = memoryStorage();
  const first = repository(storage, ['first-id']);
  const second = repository(storage, ['second-id']);
  await Promise.all([first.create(fixtures()[0]), second.create(fixtures()[1])]);
  assert.deepEqual((await first.list()).map(({ id }) => id).sort(), ['first-id', 'second-id']);
});

test('rejects cross-service mutation and invalid updates without changing the saved record', async () => {
  const repo = repository();
  const record = await repo.create(fixtures()[0]);
  await assert.rejects(repo.update(record.id, { status: 'bad' }));
  await assert.rejects(repo.update(record.id, { budget: fixtures()[1].budget }));
  assert.deepEqual(await repo.getById(record.id), record);
});
