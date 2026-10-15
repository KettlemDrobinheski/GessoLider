import assert from 'node:assert/strict';
import test from 'node:test';
import './register-typescript.mjs';

const { emptyClient, validateClient, formatPhone, formatCep, normalizePhone, normalizeCep,
  formatClientAddress, parseClientData, withClient, clientRouteKeys } = await import('../src/utils/client.ts');
const client = { ...emptyClient, name: 'João da Silva' };

test('rejects empty and whitespace-only names', () => {
  for (const name of ['', ' ', '\n\t']) assert.equal(validateClient({ ...client, name }).value, null);
});
test('accepts and trims a name without requiring optional fields', () => {
  assert.deepEqual(validateClient({ ...client, name: ' João da Silva ' }).value, client);
});
test('accepts empty phone and CEP', () => {
  assert.equal(validateClient(client).errors.phone, undefined);
  assert.equal(validateClient(client).errors.cep, undefined);
});
test('accepts Brazilian mobile and landline phone numbers and stores digits', () => {
  for (const phone of ['(41) 99999-9999', '41999999999', '(41) 3333-4444']) {
    assert.equal(validateClient({ ...client, phone }).value.phone, normalizePhone(phone));
  }
});
test('rejects incomplete, oversized and malformed phones', () => {
  for (const phone of ['123', '01999999999', '419999999999', 'abc', '41abc999999999']) {
    assert.ok(validateClient({ ...client, phone }).errors.phone);
  }
});
test('accepts CEP with eight digits and normalizes its mask', () => {
  for (const cep of ['83750000', '83750-000']) assert.equal(validateClient({ ...client, cep }).value.cep, '83750000');
});
test('rejects invalid CEP', () => {
  for (const cep of ['123', '123456789', 'abcdefgh', '83750abc000']) assert.ok(validateClient({ ...client, cep }).errors.cep);
});
test('formats phones and partial input without truncating extra digits', () => {
  assert.equal(formatPhone('41999999999'), '(41) 99999-9999');
  assert.equal(formatPhone('4133334444'), '(41) 3333-4444');
  assert.equal(formatPhone(''), '');
  assert.equal(formatPhone('4'), '(4');
  assert.equal(formatPhone('419'), '(41) 9');
  assert.equal(normalizePhone(formatPhone('419999999999')), '419999999999');
});
test('formats full and partial CEP input', () => {
  assert.equal(formatCep('83750000'), '83750-000');
  assert.equal(formatCep(''), '');
  assert.equal(formatCep('83750'), '83750');
  assert.equal(normalizeCep('83750-000'), '83750000');
});
test('formats address without blank lines or dangling separators', () => {
  assert.deepEqual(formatClientAddress(client), []);
  assert.deepEqual(formatClientAddress({ ...client, number: 'S/N', state: 'PR' }), ['S/N', 'PR']);
  assert.deepEqual(formatClientAddress({ ...client, street: 'Rua das Flores', number: '123', neighborhood: 'Centro', city: 'Lapa', state: 'PR', cep: '83750000' }),
    ['Rua das Flores, 123', 'Centro', 'Lapa - PR', 'CEP 83750-000']);
  assert.deepEqual(formatClientAddress({ ...client, street: 'Rua das Flores', city: 'Lapa' }), ['Rua das Flores', 'Lapa']);
});
test('permits real address numbers and optional notes', () => {
  for (const number of ['123', 'S/N', 'Fundos', '']) assert.equal(validateClient({ ...client, number }).value.number, number);
  assert.equal(validateClient({ ...client, state: 'pr', notes: ' Pintura ' }).value.state, 'PR');
  assert.equal(validateClient({ ...client, notes: ' Pintura ' }).value.notes, 'Pintura');
});
test('serializes structured client fields for future document generation', () => {
  const full = { ...client, phone: '41999999999', cep: '83750000', complement: 'Fundos', notes: 'Pintura' };
  assert.deepEqual(parseClientData(JSON.stringify(full)), full);
  for (const input of [undefined, [], '{}', 'null', '{', JSON.stringify({ ...client, phone: 123 })]) assert.equal(parseClientData(input), null);
});
for (const servico of ['wall', 'ceiling', 'lining']) {
  test(`editing client preserves all ${servico} budget route parameters`, () => {
    const params = Object.freeze({ servico, orcamento: JSON.stringify({ measurements: { width: 4, height: 2.7 }, configuration: { wastePercent: 5 } }),
      valores: JSON.stringify({ laborRate: 60, materialsTotal: 850, notes: 'Obra' }), cliente: JSON.stringify(client) });
    const updated = withClient(params, { ...client, name: 'Maria', street: 'Rua Nova' });
    assert.equal(updated.orcamento, params.orcamento);
    assert.equal(updated.valores, params.valores);
    assert.equal(updated.servico, params.servico);
    assert.equal(parseClientData(updated.cliente).name, 'Maria');
    assert.equal(parseClientData(params.cliente).name, client.name);
  });
}
test('updates earlier screens of only the active budget when editing client', () => {
  assert.deepEqual(clientRouteKeys([
    { name: 'home', key: 'home' }, { name: 'orcamento/tipo-servico', key: 'old-service' },
    { name: 'orcamento/resumo', key: 'old-summary' }, { name: 'orcamento/tipo-servico', key: 'new-service' },
    { name: 'orcamento/medidas', key: 'measurements' }, { name: 'orcamento/valores', key: 'values' },
    { name: 'orcamento/resumo', key: 'summary' }, { name: 'orcamento/cliente', key: 'client' },
  ]), ['measurements', 'values', 'summary', 'client']);
});
