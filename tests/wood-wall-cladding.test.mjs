import assert from 'node:assert/strict';
import test from 'node:test';
import './register-typescript.mjs';

const { calculateWoodWallCladding, calculateWoodWallCladdingPricing } = await import('../src/domain/calculations/woodWallCladding.ts');
const { parseWoodWallCladdingMeasurements, parseWoodWallCladdingBudgetInput } = await import('../src/utils/wood-wall-cladding.ts');
const { validateMeasurements } = await import('../src/utils/measurements.ts');
const base = { width: 4, height: 2.7, wastePercent: 0 };
const close = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-10, `${actual} != ${expected}`);

test('calculates the area of a wooden wall', () => {
  close(calculateWoodWallCladding(base).area, 10.8);
});

for (const example of [
  { wastePercent: 0, area: 10.8, boards: 5, screws: 162, tape: 15.12, compound: 5.4 },
  { wastePercent: 5, area: 11.34, boards: 6, screws: 171, tape: 15.876, compound: 5.67 },
  { wastePercent: 10, area: 11.88, boards: 6, screws: 179, tape: 16.632, compound: 5.94 },
]) {
  test(`calculates all cladding materials with ${example.wastePercent}% waste`, () => {
    const result = calculateWoodWallCladding({ ...base, wastePercent: example.wastePercent });
    assert.equal(result.status, 'valid');
    close(result.area, 10.8);
    close(result.areaWithWaste, example.area);
    assert.equal(result.boards, example.boards);
    assert.equal(result.screws, example.screws);
    assert.equal(result.screwBoxes, 1);
    close(result.tapeMeters, example.tape);
    close(result.compoundKg, example.compound);
  });
}

test('rounds boards up without adding one at exact decimal multiples', () => {
  assert.equal(calculateWoodWallCladding({ ...base, width: 1.2, height: 1.8 }).boards, 1);
  assert.equal(calculateWoodWallCladding({ ...base, width: 2.17, height: 1 }).boards, 2);
  assert.equal(calculateWoodWallCladding({ ...base, width: 0.1, height: 0.1 }).boards, 1);
});

test('rounds estimated screws up', () => {
  assert.equal(calculateWoodWallCladding({ ...base, width: 1, height: 0.1 }).screws, 2);
  assert.equal(calculateWoodWallCladding({ ...base, width: 0.2, height: 1 }).screws, 3);
});

test('rounds boxes of 1000 up at package boundaries', () => {
  assert.equal(calculateWoodWallCladding({ ...base, width: 1, height: 66.6 }).screwBoxes, 1);
  const exact = calculateWoodWallCladding({ ...base, width: 1, height: 1000 / 15 });
  assert.equal(exact.screws, 1000);
  assert.equal(exact.screwBoxes, 1);
  assert.equal(calculateWoodWallCladding({ ...base, width: 1, height: 66.7 }).screwBoxes, 2);
  assert.equal(calculateWoodWallCladding({ ...base, width: 10, height: 10 }).screwBoxes, 2);
});

test('returns only the requested material estimates without metal structure or invented packaging', () => {
  assert.deepEqual(Object.keys(calculateWoodWallCladding(base)).sort(), [
    'status', 'area', 'areaWithWaste', 'wastePercent', 'boards', 'screws', 'screwBoxes', 'tapeMeters', 'compoundKg',
  ].sort());
});

test('rejects invalid dimensions and waste options', () => {
  for (const key of ['width', 'height']) {
    for (const value of [0, -1, NaN, Infinity, null, undefined, '4']) {
      assert.equal(calculateWoodWallCladding({ ...base, [key]: value }).status, 'invalid');
    }
  }
  for (const wastePercent of [-5, 1, 20, '5', null]) {
    assert.equal(calculateWoodWallCladding({ ...base, wastePercent }).status, 'invalid');
  }
});

test('rejects overflow, unsafe quantities and area underflow', () => {
  for (const dimensions of [
    { width: Number.MAX_VALUE, height: 2 }, { width: Number.MAX_SAFE_INTEGER, height: 1 },
    { width: Number.MIN_VALUE, height: Number.MIN_VALUE },
  ]) assert.equal(calculateWoodWallCladding({ ...base, ...dimensions }).status, 'invalid');
});

test('does not mutate inputs and calculates deterministically', () => {
  const input = Object.freeze({ ...base });
  assert.deepEqual(calculateWoodWallCladding(input), calculateWoodWallCladding(input));
  assert.deepEqual(input, base);
});

test('charges labor on area without waste and adds manually entered materials', () => {
  const measurements = { service: 'lining', width: 4, height: 2.7 };
  const values = { laborRate: 60, materialsTotal: 850.5, notes: 'Madeira' };
  for (const wastePercent of [0, 5, 10]) {
    calculateWoodWallCladding({ ...measurements, wastePercent });
    const result = calculateWoodWallCladdingPricing(measurements, values);
    close(result.billingArea, 10.8);
    assert.equal(result.laborTotal, 648);
    assert.equal(result.total, 1498.5);
    assert.equal(result.notes, 'Madeira');
  }
});

test('accepts customer-supplied materials and rounds labor to cents', () => {
  const result = calculateWoodWallCladdingPricing({ service: 'lining', width: 1.11, height: 1 }, { laborRate: 2.25, materialsTotal: 0, notes: '' });
  assert.equal(result.laborTotal, 2.5);
  assert.equal(result.total, 2.5);
});

test('rejects invalid monetary inputs and unsafe totals', () => {
  const measurements = { service: 'lining', width: 4, height: 2.7 };
  for (const laborRate of [0, -1, NaN, Infinity, 1.001]) {
    assert.equal(calculateWoodWallCladdingPricing(measurements, { laborRate, materialsTotal: 0, notes: '' }), null);
  }
  assert.equal(calculateWoodWallCladdingPricing(measurements, { laborRate: 60, materialsTotal: -1, notes: '' }), null);
  assert.equal(calculateWoodWallCladdingPricing({ ...measurements, width: Number.MAX_VALUE }, { laborRate: 60, materialsTotal: 0, notes: '' }), null);
});

test('maps the existing lining measurement validation to width and height', () => {
  const result = validateMeasurements('lining', { length: '4', height: '2,70', width: '', depth: '' }, false, []);
  const measurements = { service: 'lining', width: result.value.length, height: result.value.height };
  close(calculateWoodWallCladding({ ...measurements, wastePercent: 0 }).area, result.areas.gross);
});

test('round-trips configuration and measurements when editing a budget', () => {
  const measurements = { service: 'lining', width: 4, height: 2.7 };
  const budget = { measurements, configuration: { wastePercent: 5 } };
  assert.deepEqual(parseWoodWallCladdingMeasurements(JSON.stringify(measurements)), measurements);
  assert.deepEqual(parseWoodWallCladdingBudgetInput(JSON.stringify(budget)), budget);
  const edited = { ...budget, measurements: { ...measurements, width: 5 } };
  const restored = parseWoodWallCladdingBudgetInput(JSON.stringify(edited));
  close(calculateWoodWallCladding({ ...restored.measurements, ...restored.configuration }).area, 13.5);
});

test('rejects broken route parameters and payloads from other services', () => {
  for (const value of [undefined, [], ['{}'], '{', '{}', 'null',
    JSON.stringify({ service: 'ceiling', width: 4, height: 2.7 }),
    JSON.stringify({ service: 'wall', width: 4, height: 2.7 }),
  ]) {
    assert.equal(parseWoodWallCladdingMeasurements(value), null);
    assert.equal(parseWoodWallCladdingBudgetInput(value), null);
  }
  assert.equal(parseWoodWallCladdingBudgetInput(JSON.stringify({
    measurements: { service: 'lining', width: 4, height: 2.7 }, configuration: { wastePercent: 20 },
  })), null);
});
