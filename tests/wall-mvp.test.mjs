import assert from 'node:assert/strict';
import test from 'node:test';
import './register-typescript.mjs';

const { calculateWallInsulation } = await import('../src/domain/calculations/wallInsulation.ts');
const { calculateWallMaterials } = await import('../src/domain/calculations/wallMaterials.ts');
const { calculateWallLabor, calculateBudgetTotal, calculateWallPricing } = await import('../src/domain/calculations/wallPricing.ts');
const { formatBRL, parseCurrencyInput } = await import('../src/utils/currency.ts');
const { parseWallPricingInput } = await import('../src/utils/wall-pricing.ts');
const base = {
  length: 4, height: 2.7, openings: [], studSpacingCm: 60, profileWidth: 70,
  boardType: 'ST', boardDimensions: { width: 1.2, height: 1.8 }, sides: 2, wastePercent: 5,
};

for (const [wastePercent, expected] of [[0, 10.8], [5, 11.34], [10, 11.88]]) {
  test(`calculates theoretical insulation area with ${wastePercent}% waste`, () => {
    for (const type of ['glass-wool', 'rock-wool']) {
      const insulation = calculateWallInsulation(10.8, wastePercent, type);
      assert.equal(insulation.type, type);
      assert.equal(insulation.baseArea, 10.8);
      assert.ok(Math.abs(insulation.areaWithWaste - expected) < 1e-10);
    }
  });
}

test('does not include insulation when disabled', () => {
  assert.equal(calculateWallInsulation(10.8, 5, null), null);
  assert.equal(calculateWallMaterials({ ...base, insulation: null }).insulation, null);
});

test('does not multiply insulation by the number of board sides', () => {
  const one = calculateWallMaterials({ ...base, sides: 1, insulation: 'glass-wool' });
  const two = calculateWallMaterials({ ...base, sides: 2, insulation: 'glass-wool' });
  assert.equal(one.status, 'valid');
  assert.equal(two.status, 'valid');
  assert.deepEqual(one.insulation, two.insulation);
  assert.ok(Math.abs(two.insulation.areaWithWaste - 11.34) < 1e-10);
});

test('rejects invalid insulation data without returning quantities', () => {
  for (const area of [0, -1, NaN, Infinity]) assert.equal(calculateWallInsulation(area, 5, 'glass-wool'), null);
  assert.equal(calculateWallInsulation(10.8, 15, 'glass-wool'), null);
  const result = calculateWallMaterials({ ...base, insulation: 'invalid' });
  assert.equal(result.status, 'invalid');
  assert.equal('boards' in result, false);
});

test('retains unsupported wall protections with insulation enabled', () => {
  for (const input of [
    { ...base, height: 4 },
    { ...base, openings: [{ id: 'a', type: 'door', width: 1, height: 2, quantity: 1 }] },
    { ...base, openings: [{ id: 'a', type: 'window', width: 1, height: 1, quantity: 1 }] },
  ]) {
    const result = calculateWallMaterials({ ...input, insulation: 'rock-wool' });
    assert.equal(result.status, 'unsupported');
    assert.equal('insulation' in result, false);
  }
});

test('calculates labor on one geometric wall area', () => {
  assert.deepEqual(calculateWallLabor(base, 45), { billingArea: 10.8, laborTotal: 486 });
});

test('labor billing ignores board sides and waste', () => {
  for (const sides of [1, 2]) for (const wastePercent of [0, 5, 10]) {
    assert.equal(calculateWallLabor({ ...base, sides, wastePercent }, 45).laborTotal, 486);
  }
});

test('calculates decimal labor rates and rounds the final labor value to cents', () => {
  assert.equal(calculateWallLabor(base, 45.5).laborTotal, 491.4);
  assert.equal(calculateWallLabor({ length: 1, height: 1.333 }, 1).laborTotal, 1.33);
});

test('rejects invalid labor rates and dimensions', () => {
  for (const laborRate of [0, -1, NaN, Infinity, '45', 0.001]) assert.equal(calculateWallLabor(base, laborRate), null);
  for (const field of ['length', 'height']) for (const value of [0, -1, NaN, Infinity, undefined]) {
    assert.equal(calculateWallLabor({ ...base, [field]: value }, 45), null);
  }
});

test('adds materials and labor into the expected budget total', () => {
  assert.equal(calculateBudgetTotal(750, 486), 1236);
});

test('accepts zero materials when the customer provides them', () => {
  assert.equal(calculateBudgetTotal(0, 486), 486);
  assert.equal(calculateWallPricing(base, { laborRate: 45, materialsTotal: 0, notes: '' }).total, 486);
});

test('adds decimal currency values without accumulating binary fractions', () => {
  assert.equal(calculateBudgetTotal(0.1, 0.2), 0.3);
  assert.equal(calculateBudgetTotal(750.25, 486.5), 1236.75);
});

test('rejects negative, nonfinite and unsafe totals', () => {
  for (const value of [-1, NaN, Infinity, '750', 0.001, Number.MAX_VALUE]) {
    assert.equal(calculateBudgetTotal(value, 486), null);
    assert.equal(calculateBudgetTotal(750, value), null);
  }
});

test('parses Brazilian monetary input', () => {
  for (const [input, expected] of [['45', 45], ['45,5', 45.5], ['45,50', 45.5], ['45.50', 45.5], ['0', 0], [' 750,00 ', 750]]) {
    assert.equal(parseCurrencyInput(input), expected);
  }
});

test('rejects empty, negative and malformed monetary input', () => {
  for (const input of ['', ' ', '-1', 'NaN', 'Infinity', '1e3', '45,', '45,500', '1.000,00', 'R$ 45,00', '45,5.0']) {
    assert.equal(parseCurrencyInput(input), null, input);
  }
});

test('formats BRL without affecting numeric calculation', () => {
  assert.equal(formatBRL(1236).replace(/\s/g, ' '), 'R$ 1.236,00');
});

test('preserves observations and returns the full numeric pricing result', () => {
  const input = { laborRate: 45, materialsTotal: 750, notes: 'Pintura não inclusa.' };
  assert.deepEqual(calculateWallPricing(base, input), { ...input, billingArea: 10.8, laborTotal: 486, total: 1236 });
});

test('round-trips numeric values and observations for editing', () => {
  const input = { laborRate: 45.5, materialsTotal: 0, notes: 'Material fornecido pelo cliente.' };
  assert.deepEqual(parseWallPricingInput(JSON.stringify(input)), input);
  for (const value of [undefined, ['{}'], '{', '{}', JSON.stringify({ ...input, laborRate: 0 }), JSON.stringify({ ...input, materialsTotal: -1 }), JSON.stringify({ ...input, notes: null })]) {
    assert.equal(parseWallPricingInput(value), null);
  }
});
