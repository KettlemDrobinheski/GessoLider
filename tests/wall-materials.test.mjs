import assert from 'node:assert/strict';
import test from 'node:test';
import './register-typescript.mjs';

const { calculateWallMaterials } = await import('../src/domain/calculations/wallMaterials.ts');
const { calculateWallProfiles } = await import('../src/domain/calculations/wallProfiles.ts');
const { buildWallConfiguration, parseWallBudgetInput } = await import('../src/utils/wall-configuration.ts');
const base = {
  length: 4, height: 2.7, openings: [], studSpacingCm: 60,
  boardType: 'ST', boardDimensions: { width: 1.2, height: 1.8 }, sides: 2, wastePercent: 0, profileWidth: 70,
};

test('preserves profile quantities across board types, sides, margins, profiles and spacings', () => {
  let combinations = 0;
  for (const boardType of ['ST', 'RU', 'RF']) for (const sides of [1, 2]) for (const wastePercent of [0, 5, 10])
    for (const profileWidth of [48, 70, 90]) for (const studSpacingCm of [40, 60]) {
      const input = { ...base, boardType, sides, wastePercent, profileWidth, studSpacingCm };
      const result = calculateWallMaterials(input);
      const profiles = calculateWallProfiles(input);
      assert.equal(result.status, 'valid');
      assert.deepEqual(result.guides, { ...profiles.guides, width: profileWidth });
      assert.deepEqual(result.studs, { ...profiles.studs, width: profileWidth, spacingCm: studSpacingCm });
      assert.equal(result.guides.quantity, 3);
      assert.equal(result.studs.quantity, studSpacingCm === 60 ? 8 : 11);
      assert.equal(result.boards.type, boardType);
      assert.equal(result.boards.quantity, sides === 1 ? (wastePercent === 0 ? 5 : 6) : (wastePercent === 0 ? 10 : 11));
      combinations++;
    }
  assert.equal(combinations, 108);
});

test('returns no partial list when height or openings are unsupported', () => {
  for (const input of [
    { ...base, height: 4 },
    { ...base, openings: [{ id: 'door', type: 'door', width: 1, height: 2, quantity: 1 }] },
    { ...base, openings: [{ id: 'window', type: 'window', width: 1, height: 1, quantity: 1 }] },
  ]) {
    const result = calculateWallMaterials(input);
    assert.equal(result.status, 'unsupported');
    for (const material of ['boards', 'guides', 'studs']) assert.equal(material in result, false);
  }
});

test('does not return partial quantities for invalid configurations', () => {
  for (const input of [{ ...base, wastePercent: 15 }, { ...base, sides: 3 }, { ...base, profileWidth: 50 }, { ...base, studSpacingCm: 50 }]) {
    const result = calculateWallMaterials(input);
    assert.equal(result.status, 'invalid');
    for (const material of ['boards', 'guides', 'studs']) assert.equal(material in result, false);
  }
});

test('requires an explicit waste choice and accepts zero as a complete selection', () => {
  const draft = { boardType: 'ST', profileWidth: 70, studSpacingCm: 60, sides: 2, hasInsulation: false, insulationType: null, wastePercent: null };
  assert.equal(buildWallConfiguration(draft), null);
  for (const wastePercent of [0, 5, 10]) assert.equal(buildWallConfiguration({ ...draft, wastePercent }).wastePercent, wastePercent);
});

test('transports waste, board, sides and insulation without losing configuration', () => {
  const measurements = { service: 'wall', length: 4, height: 2.7, openings: [], areas: { gross: 10.8, openings: 0, net: 10.8 } };
  for (const wastePercent of [0, 5, 10]) {
    const configuration = buildWallConfiguration({ boardType: 'RU', profileWidth: 90, studSpacingCm: 40, sides: 2, wastePercent, hasInsulation: true, insulationType: 'rock-wool' });
    const budget = { measurements, configuration };
    assert.deepEqual(parseWallBudgetInput(JSON.stringify(budget)), budget);
    assert.equal(parseWallBudgetInput(JSON.stringify({ measurements, configuration: { ...configuration, wastePercent: undefined } })), null);
    assert.equal(parseWallBudgetInput(JSON.stringify({ measurements, configuration: { ...configuration, wastePercent: 15 } })), null);
  }
});
