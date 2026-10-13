import assert from 'node:assert/strict';
import test from 'node:test';
import './register-typescript.mjs';

const { calculateWallArea, calculateCoveringArea } = await import('../src/domain/calculations/wallAreas.ts');
const { calculateWallConsumables } = await import('../src/domain/calculations/wallConsumables.ts');
const { calculateWallMaterials } = await import('../src/domain/calculations/wallMaterials.ts');
const { calculateWallPricing } = await import('../src/domain/calculations/wallPricing.ts');
const { buildWallConfiguration, parseWallBudgetInput } = await import('../src/utils/wall-configuration.ts');
const base = {
  length: 4, height: 2.7, openings: [], boardType: 'ST', boardDimensions: { width: 1.2, height: 1.8 },
  profileWidth: 70, studSpacingCm: 60, sides: 2, wastePercent: 5, insulation: 'glass-wool', acousticBand: true,
};

function close(actual, expected) {
  assert.ok(Math.abs(actual - expected) < 1e-10, `${actual} != ${expected}`);
}

test('returns the complete requested wall example and pricing', () => {
  const result = calculateWallMaterials(base);
  assert.equal(result.status, 'valid');
  close(result.wallArea, 10.8);
  close(result.coveringArea, 21.6);
  assert.equal(result.boards.quantity, 11);
  assert.equal(result.guides.quantity, 3);
  assert.equal(result.studs.quantity, 8);
  assert.equal(result.consumables.boardScrews.quantity, 324);
  close(result.consumables.jointTape.meters, 30.24);
  close(result.consumables.jointCompound.kilograms, 10.8);
  close(result.insulation.areaWithWaste, 11.34);
  close(result.consumables.acousticBand.meters, 9.72);
  assert.equal(result.consumables.acousticBand.method, 'area-coefficient');
  const pricing = calculateWallPricing(base, { laborRate: 45, materialsTotal: 750, notes: '' });
  assert.equal(pricing.laborTotal, 486);
  assert.equal(pricing.total, 1236);
});

test('centralizes wall and covering areas for one and two sides', () => {
  assert.equal(calculateWallArea(base), 10.8);
  assert.equal(calculateCoveringArea(10.8, 1), 10.8);
  assert.equal(calculateCoveringArea(10.8, 2), 21.6);
});

test('rejects invalid reference areas and sides', () => {
  for (const value of [0, -1, NaN, Infinity, '4']) {
    assert.equal(calculateWallArea({ ...base, length: value }), null);
    assert.equal(calculateWallArea({ ...base, height: value }), null);
    assert.equal(calculateCoveringArea(value, 2), null);
  }
  for (const sides of [0, 3, '2', undefined]) assert.equal(calculateCoveringArea(10.8, sides), null);
});

test('estimates one-side consumables without changing the acoustic band area', () => {
  const result = calculateWallMaterials({ ...base, sides: 1 });
  assert.equal(result.status, 'valid');
  assert.equal(result.consumables.boardScrews.quantity, 162);
  close(result.consumables.jointTape.meters, 15.12);
  close(result.consumables.jointCompound.kilograms, 5.4);
  close(result.consumables.acousticBand.meters, 9.72);
});

test('does not apply waste to screws, tape, compound or acoustic band', () => {
  const reference = calculateWallMaterials({ ...base, wastePercent: 0 }).consumables;
  for (const wastePercent of [5, 10]) assert.deepEqual(calculateWallMaterials({ ...base, wastePercent }).consumables, reference);
});

test('keeps metal-metal screws explicitly undefined instead of using board coefficients', () => {
  assert.deepEqual(calculateWallMaterials(base).consumables.metalScrews, { status: 'to-define' });
  assert.equal('quantity' in calculateWallMaterials(base).consumables.metalScrews, false);
});

test('omits acoustic band when it is not selected', () => {
  assert.equal(calculateWallMaterials({ ...base, acousticBand: false }).consumables.acousticBand, null);
});

test('omits insulation when disabled and never doubles its internal wall area', () => {
  assert.equal(calculateWallMaterials({ ...base, insulation: null }).insulation, null);
  assert.deepEqual(calculateWallMaterials({ ...base, sides: 1 }).insulation, calculateWallMaterials(base).insulation);
});

test('rounds fractional screw estimates upward', () => {
  assert.equal(calculateWallConsumables(1.01, 1.01, false).boardScrews.quantity, 16);
  assert.equal(calculateWallConsumables(10.8, 21.6, true).boardScrews.quantity, 324);
});

test('does not add a screw solely from floating point noise at an integer boundary', () => {
  assert.equal(calculateWallConsumables(0.14, 0.14 * 10, false).boardScrews.quantity, 21);
});

test('requires a boolean acoustic band choice in the consumables calculation', () => {
  for (const acousticBand of [null, 'Sim', 1, undefined]) assert.equal(calculateWallConsumables(10.8, 21.6, acousticBand), null);
  assert.equal(calculateWallMaterials({ ...base, acousticBand: null }).status, 'invalid');
});

test('requires an explicit band selection in the configuration draft', () => {
  const draft = { boardType: 'ST', profileWidth: 70, studSpacingCm: 60, sides: 2, wastePercent: 5, hasInsulation: true, insulationType: 'glass-wool', acousticBand: null };
  assert.equal(buildWallConfiguration(draft), null);
  for (const acousticBand of [true, false]) assert.equal(buildWallConfiguration({ ...draft, acousticBand }).acousticBand, acousticBand);
});

test('preserves acoustic band and insulation in route serialization', () => {
  for (const acousticBand of [true, false]) {
    const configuration = buildWallConfiguration({ boardType: 'RF', profileWidth: 48, studSpacingCm: 40, sides: 1, wastePercent: 10, hasInsulation: true, insulationType: 'rock-wool', acousticBand });
    const budget = { configuration, measurements: { service: 'wall', length: 4, height: 2.7, openings: [], areas: { gross: 10.8, openings: 0, net: 10.8 } } };
    assert.deepEqual(parseWallBudgetInput(JSON.stringify(budget)), budget);
    assert.equal(parseWallBudgetInput(JSON.stringify({ ...budget, configuration: { ...configuration, acousticBand: undefined } })), null);
  }
});

test('covers every board, profile, spacing, margin, side, insulation and band combination', () => {
  let count = 0;
  for (const boardType of ['ST', 'RU', 'RF']) for (const profileWidth of [48, 70, 90]) for (const studSpacingCm of [40, 60])
    for (const sides of [1, 2]) for (const wastePercent of [0, 5, 10]) for (const insulation of [null, 'glass-wool', 'rock-wool'])
      for (const acousticBand of [true, false]) {
        const result = calculateWallMaterials({ ...base, boardType, profileWidth, studSpacingCm, sides, wastePercent, insulation, acousticBand });
        assert.equal(result.status, 'valid');
        assert.equal(result.boards.type, boardType);
        assert.equal(result.guides.width, profileWidth);
        assert.equal(result.guides.quantity, 3);
        assert.equal(result.studs.quantity, studSpacingCm === 60 ? 8 : 11);
        assert.equal(result.consumables.boardScrews.quantity, sides === 1 ? 162 : 324);
        close(result.consumables.jointTape.meters, sides === 1 ? 15.12 : 30.24);
        close(result.consumables.jointCompound.kilograms, sides === 1 ? 5.4 : 10.8);
        assert.equal(result.consumables.acousticBand !== null, acousticBand);
        assert.equal(result.insulation !== null, insulation !== null);
        if (result.insulation) close(result.insulation.areaWithWaste, 10.8 * (1 + wastePercent / 100));
        count++;
      }
  assert.equal(count, 648);
});

test('retains unsupported walls without any partial materials list', () => {
  for (const input of [{ ...base, height: 4 }, ...['door', 'window'].map((type) => ({ ...base, openings: [{ id: type, type, width: 1, height: 1, quantity: 1 }] }))]) {
    const result = calculateWallMaterials(input);
    assert.equal(result.status, 'unsupported');
    for (const key of ['boards', 'guides', 'studs', 'consumables', 'insulation']) assert.equal(key in result, false);
  }
});

test('rejects nonfinite or unsafe consumable quantities', () => {
  for (const area of [0, -1, Infinity, NaN, Number.MAX_VALUE]) assert.equal(calculateWallConsumables(area, area, true), null);
});
