import assert from 'node:assert/strict';
import test from 'node:test';
import './register-typescript.mjs';

const { calculateCeiling } = await import('../src/domain/calculations/ceiling.ts');
const { calculateCeilingPricing } = await import('../src/domain/calculations/ceilingPricing.ts');
const { parseCeilingBudgetInput, parseCeilingMeasurements } = await import('../src/utils/ceiling.ts');
const { parseBudgetPricingInput } = await import('../src/utils/budget-pricing.ts');
const base = { length: 5, width: 4, spacingCm: 40, wastePercent: 0 };
const measurements = { service: 'ceiling', length: 5, width: 4 };

test('calculates ceiling area without height', () => {
  const result = calculateCeiling(base);
  assert.equal(result.status, 'valid');
  assert.equal(result.area, 20);
  assert.equal(result.areaWithWaste, 20);
});

test('rounds ST boards up using 2.16 square meters per board', () => {
  assert.equal(calculateCeiling(base).boards, 10);
  assert.equal(calculateCeiling({ ...base, length: 1.2, width: 1.8 }).boards, 1);
  assert.equal(calculateCeiling({ ...base, length: 1, width: 2.17 }).boards, 2);
});

test('calculates F530 lines and 3 meter bars with 40 cm spacing', () => {
  const result = calculateCeiling(base);
  assert.equal(result.profileLines, 11);
  assert.equal(result.profileMeters, 55);
  assert.equal(result.profilesPerLine, 2);
  assert.equal(result.profiles, 22);
});

test('calculates F530 with 60 cm spacing', () => {
  const result = calculateCeiling({ ...base, spacingCm: 60 });
  assert.equal(result.profileLines, 8);
  assert.equal(result.profileMeters, 40);
  assert.equal(result.profilesPerLine, 2);
  assert.equal(result.profiles, 16);
});

test('counts commercial F530 pieces independently for each profile line', () => {
  for (const [length, expectedPerLine] of [[2.9, 1], [3, 1], [3.01, 2]]) {
    const result = calculateCeiling({ ...base, length, width: 0.1, wastePercent: 0 });
    assert.equal(result.status, 'valid');
    assert.equal(result.profileLines, 2);
    assert.equal(result.profilesPerLine, expectedPerLine);
    assert.equal(result.profiles, expectedPerLine * result.profileLines);
  }
});

test('does not add a profile line at an exact decimal spacing multiple', () => {
  assert.equal(calculateCeiling({ ...base, width: 4.2, spacingCm: 60 }).profileLines, 8);
});

test('calculates cantoneiras from the perimeter', () => {
  const result = calculateCeiling(base);
  assert.equal(result.perimeter, 18);
  assert.equal(result.angleMetersWithWaste, 18);
  assert.deepEqual(result.anglePiecesBySide, [2, 2, 2, 2]);
  assert.equal(result.angles, 8);
});

test('counts corner angles per side when each side exceeds one commercial piece', () => {
  const result = calculateCeiling({ ...base, length: 5, width: 5, wastePercent: 0 });
  assert.equal(result.perimeter, 20);
  assert.deepEqual(result.anglePiecesBySide, [2, 2, 2, 2]);
  assert.equal(result.angles, 8);
});

test('counts commercial angle pieces independently for sides below, at and above 3 meters', () => {
  for (const [side, expectedPerSide] of [[2.9, 1], [3, 1], [3.01, 2]]) {
    const result = calculateCeiling({ ...base, length: side, width: side, wastePercent: 0 });
    assert.deepEqual(result.anglePiecesBySide, Array(4).fill(expectedPerSide));
    assert.equal(result.angles, expectedPerSide * 4);
  }
});

for (const example of [
  { wastePercent: 5, area: 21, boards: 10, profiles: 24, angles: 9, screws: 315, tape: 29.4, compound: 10.5 },
  { wastePercent: 10, area: 22, boards: 11, profiles: 25, angles: 9, screws: 330, tape: 30.8, compound: 11 },
]) {
  test(`applies ${example.wastePercent}% waste to every material estimate`, () => {
    const result = calculateCeiling({ ...base, wastePercent: example.wastePercent });
    assert.equal(result.area, 20);
    assert.equal(result.areaWithWaste, example.area);
    assert.equal(result.boards, example.boards);
    assert.equal(result.profiles, example.profiles);
    assert.equal(result.angles, example.angles);
    assert.equal(result.profileLines, 11);
    assert.equal(result.profilesPerLine, 2);
    assert.deepEqual(result.anglePiecesBySide, [2, 2, 2, 2]);
    assert.equal(result.screws, example.screws);
    assert.ok(Math.abs(result.profileMetersWithWaste - 55 * (1 + example.wastePercent / 100)) < 1e-10);
    assert.ok(Math.abs(result.angleMetersWithWaste - 18 * (1 + example.wastePercent / 100)) < 1e-10);
    assert.ok(Math.abs(result.tapeMeters - example.tape) < 1e-10);
    assert.equal(result.compoundKg, example.compound);
  });
}

test('calculates G25 screws and boxes of 1000, rounding both up', () => {
  assert.equal(calculateCeiling(base).screws, 300);
  assert.equal(calculateCeiling(base).screwBoxes, 1);
  const result = calculateCeiling({ ...base, length: 10, width: 10 });
  assert.equal(result.screws, 1500);
  assert.equal(result.screwBoxes, 2);
  assert.equal(calculateCeiling({ ...base, length: 1, width: 0.1 }).screws, 2);
});

test('applies the selected waste percentage once to per-segment piece counts', () => {
  for (const [wastePercent, profiles, angles] of [[0, 22, 8], [5, 24, 9], [10, 25, 9]]) {
    const result = calculateCeiling({ ...base, wastePercent });
    assert.equal(result.profiles, profiles);
    assert.equal(result.angles, angles);
  }
});

test('calculates joint tape in meters without inventing rolls', () => {
  const result = calculateCeiling(base);
  assert.equal(result.tapeMeters, 28);
  assert.equal('tapeRolls' in result, false);
});

test('calculates joint compound in kilograms without inventing buckets', () => {
  const result = calculateCeiling(base);
  assert.equal(result.compoundKg, 10);
  assert.equal('compoundBuckets' in result, false);
});

test('rejects malformed dimensions and unsupported configuration', () => {
  for (const key of ['length', 'width']) {
    for (const value of [0, -1, NaN, Infinity, '5', null, undefined]) {
      assert.equal(calculateCeiling({ ...base, [key]: value }).status, 'invalid');
    }
  }
  for (const spacingCm of [0, 50, '40', null]) assert.equal(calculateCeiling({ ...base, spacingCm }).status, 'invalid');
  for (const wastePercent of [-5, 1, 20, '5', null]) assert.equal(calculateCeiling({ ...base, wastePercent }).status, 'invalid');
});

test('rejects overflow, unsafe quantities and area underflow', () => {
  for (const input of [
    { ...base, length: Number.MAX_VALUE }, { ...base, width: Number.MAX_SAFE_INTEGER },
    { ...base, length: Number.MIN_VALUE, width: Number.MIN_VALUE },
  ]) assert.equal(calculateCeiling(input).status, 'invalid');
});

test('calculation is deterministic and does not mutate its input', () => {
  const input = Object.freeze({ ...base });
  assert.deepEqual(calculateCeiling(input), calculateCeiling(input));
  assert.deepEqual(input, base);
});

test('charges labor on ceiling area and adds manually entered materials', () => {
  const result = calculateCeilingPricing(measurements, { laborRate: 60, materialsTotal: 850.5, notes: 'Teste' });
  assert.deepEqual(result, { laborRate: 60, materialsTotal: 850.5, notes: 'Teste', billingArea: 20, laborTotal: 1200, total: 2050.5 });
});

test('waste and spacing never increase the labor billing area', () => {
  for (const wastePercent of [0, 5, 10]) {
    const budget = { measurements, configuration: { spacingCm: 60, wastePercent } };
    assert.equal(calculateCeilingPricing(budget.measurements, { laborRate: 60, materialsTotal: 0, notes: '' }).total, 1200);
  }
});

test('validates monetary input and rounds labor to cents', () => {
  assert.equal(calculateCeilingPricing({ ...measurements, length: 1.11, width: 1 }, { laborRate: 2.25, materialsTotal: 0, notes: '' }).laborTotal, 2.5);
  for (const laborRate of [0, -1, NaN, Infinity, 1.001]) {
    assert.equal(calculateCeilingPricing(measurements, { laborRate, materialsTotal: 0, notes: '' }), null);
  }
  assert.equal(calculateCeilingPricing(measurements, { laborRate: 60, materialsTotal: -1, notes: '' }), null);
  assert.equal(calculateCeilingPricing({ ...measurements, length: Number.MAX_VALUE }, { laborRate: 60, materialsTotal: 0, notes: '' }), null);
});

test('round-trips measurements, configuration and values for editing', () => {
  const budget = { measurements, configuration: { spacingCm: 60, wastePercent: 5 } };
  const values = { laborRate: 60, materialsTotal: 1000, notes: 'Observações' };
  assert.deepEqual(parseCeilingMeasurements(JSON.stringify(measurements)), measurements);
  assert.deepEqual(parseCeilingBudgetInput(JSON.stringify(budget)), budget);
  assert.deepEqual(parseBudgetPricingInput(JSON.stringify(values)), values);
  const edited = { ...budget, measurements: { ...measurements, length: 6 } };
  assert.equal(parseCeilingBudgetInput(JSON.stringify(edited)).measurements.length, 6);
  assert.equal(calculateCeilingPricing(edited.measurements, values).laborTotal, 1440);
});

test('rejects invalid route parameters and wall payloads', () => {
  for (const value of [undefined, [], ['{}'], '{', '{}', 'null', JSON.stringify({ ...measurements, service: 'wall' })]) {
    assert.equal(parseCeilingMeasurements(value), null);
    assert.equal(parseCeilingBudgetInput(value), null);
  }
  for (const configuration of [{ spacingCm: 50, wastePercent: 5 }, { spacingCm: 40, wastePercent: 20 }]) {
    assert.equal(parseCeilingBudgetInput(JSON.stringify({ measurements, configuration })), null);
  }
});
