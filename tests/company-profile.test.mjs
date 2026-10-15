import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';
import './register-typescript.mjs';

const { defaultCompanyProfile, validateCompanyProfile, parseCompanyProfile, formatCompanySummary } = await import('../src/utils/company-profile.ts');
const { createCompanyProfileRepository, companyProfileKey } = await import('../src/services/company-profile.ts');
const profile = { ...defaultCompanyProfile };

test('company defaults contain only the commercial name', () => {
  assert.equal(profile.companyName, 'GessoLider');
  assert.equal(profile.logoUri, null);
  for (const key of ['responsibleName', 'phone', 'city', 'state', 'serviceRegion', 'commercialNote']) assert.equal(profile[key], '');
});
test('rejects empty and whitespace commercial names', () => {
  for (const companyName of ['', ' ', '\n\t']) assert.ok(validateCompanyProfile({ ...profile, companyName }).errors.companyName);
});
test('accepts and trims a commercial name and allows all optional fields to be empty', () => {
  assert.deepEqual(validateCompanyProfile({ ...profile, companyName: ' GessoLider ' }).value, profile);
});
test('accepts optional phone and normalizes Brazilian mobile and landline formats', () => {
  for (const phone of ['', '(41) 99999-9999', '(41) 3333-4444']) {
    assert.equal(validateCompanyProfile({ ...profile, phone }).value.phone, phone.replace(/\D/g, ''));
  }
});
test('rejects malformed phones', () => {
  for (const phone of ['abc', '123', '01999999999', '419999999999', '41abc999999999']) {
    assert.ok(validateCompanyProfile({ ...profile, phone }).errors.phone);
  }
});
test('normalizes UF to uppercase and rejects oversized or incomplete siglas', () => {
  assert.equal(validateCompanyProfile({ ...profile, state: ' pr ' }).value.state, 'PR');
  for (const state of ['P', 'PAR', '123', '!!']) assert.ok(validateCompanyProfile({ ...profile, state }).errors.state);
});
test('default summary contains only the name and no blank rows', () => {
  assert.deepEqual(formatCompanySummary(profile), ['GessoLider']);
});
test('formats all supplied company details without empty location separators', () => {
  assert.deepEqual(formatCompanySummary({ ...profile, responsibleName: 'João', phone: '41999999999', city: 'Lapa', state: 'PR', serviceRegion: 'Lapa e região', commercialNote: 'Sujeito à vistoria.' }),
    ['GessoLider', 'Responsável: João', 'WhatsApp: (41) 99999-9999', 'Lapa - PR', 'Atendimento: Lapa e região', 'Sujeito à vistoria.']);
  assert.deepEqual(formatCompanySummary({ ...profile, state: 'PR' }), ['GessoLider', 'PR']);
  assert.deepEqual(formatCompanySummary({ ...profile, city: 'Lapa' }), ['GessoLider', 'Lapa']);
});
test('preserves a future logo URI and permits no logo', () => {
  const withLogo = { ...profile, logoUri: 'file:///logo.png' };
  assert.deepEqual(parseCompanyProfile(JSON.stringify(withLogo)), withLogo);
  assert.deepEqual(parseCompanyProfile(JSON.stringify(profile)), profile);
});
test('rejects corrupt persisted values instead of overwriting them with defaults', () => {
  for (const value of ['{', 'null', '[]', '{}', JSON.stringify({ ...profile, phone: 123 }), JSON.stringify({ ...profile, companyName: '' })]) {
    assert.equal(parseCompanyProfile(value), null);
  }
});

function memoryStorage() {
  const entries = new Map();
  return { entries, async getItem(key) { return entries.get(key) ?? null; }, async setItem(key, value) { entries.set(key, value); } };
}
test('first read returns fresh defaults without writing invented data', async () => {
  const storage = memoryStorage();
  const repository = createCompanyProfileRepository(storage);
  const initial = await repository.read();
  assert.deepEqual(initial, profile);
  initial.companyName = 'Edited';
  assert.equal((await repository.read()).companyName, 'GessoLider');
  assert.equal(storage.entries.size, 0);
});
test('saves and reloads a single global profile after repository recreation', async () => {
  const storage = memoryStorage();
  const first = createCompanyProfileRepository(storage);
  await first.save({ ...profile, responsibleName: 'João', phone: '(41) 99999-9999', city: 'Lapa', state: 'pr' });
  const reopened = createCompanyProfileRepository(storage);
  assert.deepEqual(await reopened.read(), { ...profile, responsibleName: 'João', phone: '41999999999', city: 'Lapa', state: 'PR' });
  await reopened.save({ ...profile, companyName: 'GessoLider Obras' });
  assert.equal(storage.entries.size, 1);
  assert.equal((await first.read()).companyName, 'GessoLider Obras');
  assert.ok(storage.entries.has(companyProfileKey));
});
test('invalid saves preserve the previously saved profile', async () => {
  const storage = memoryStorage();
  const repository = createCompanyProfileRepository(storage);
  await repository.save(profile);
  await assert.rejects(repository.save({ ...profile, companyName: ' ' }));
  assert.deepEqual(await repository.read(), profile);
});
test('read and write failures propagate without reporting success', async () => {
  const repository = createCompanyProfileRepository({ async getItem() { throw new Error('read failed'); }, async setItem() { throw new Error('write failed'); } });
  await assert.rejects(repository.read(), /read failed/);
  await assert.rejects(repository.save(profile), /write failed/);
  const storage = memoryStorage();
  storage.entries.set(companyProfileKey, '{');
  await assert.rejects(createCompanyProfileRepository(storage).read());
  assert.equal(storage.entries.get(companyProfileKey), '{');
});
test('integrates with installed AsyncStorage web adapter and reloads persisted data', async () => {
  const require = createRequire(import.meta.url);
  const asyncStorage = require('@react-native-async-storage/async-storage').default;
  const entries = new Map();
  const previousWindow = globalThis.window;
  globalThis.window = { localStorage: {
    getItem: (key) => entries.get(key) ?? null,
    setItem: (key, value) => { entries.set(key, value); },
  } };
  try {
    await createCompanyProfileRepository(asyncStorage).save({ ...profile, companyName: 'GessoLider Teste', serviceRegion: 'Lapa e região' });
    const reopened = createCompanyProfileRepository(asyncStorage);
    assert.equal((await reopened.read()).companyName, 'GessoLider Teste');
    assert.equal((await reopened.read()).serviceRegion, 'Lapa e região');
    assert.equal(entries.size, 1);
  } finally {
    if (previousWindow === undefined) delete globalThis.window;
    else globalThis.window = previousWindow;
  }
});
