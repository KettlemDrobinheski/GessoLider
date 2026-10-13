import assert from 'node:assert/strict';
import test from 'node:test';
import { calculateWallProfiles } from '../src/domain/calculations/wallProfiles.ts';

const base = { length: 4, height: 2.7, studSpacingCm: 60, openings: [] };
const door = { id: 'door-1', type: 'door', width: 0.8, height: 2.1, quantity: 1 };
const window = { id: 'window-1', type: 'window', width: 1.2, height: 1, quantity: 1 };

for (const example of [
  { length: 4, height: 2.7, studSpacingCm: 60, guides: 3, studs: 8 },
  { length: 4, height: 2.7, studSpacingCm: 40, guides: 3, studs: 11 },
  { length: 3, height: 2.5, studSpacingCm: 60, guides: 2, studs: 6 },
]) {
  test(`calculates ${example.length} x ${example.height} m at ${example.studSpacingCm} cm`, () => {
    const result = calculateWallProfiles({ ...base, ...example });
    assert.deepEqual(result, {
      status: 'valid',
      guides: { quantity: example.guides, pieceLength: 3, totalLength: example.length * 2 },
      studs: { quantity: example.studs, pieceLength: 3 },
    });
  });
}

for (const field of ['length', 'height']) {
  test(`rejects invalid ${field} without quantities`, () => {
    for (const value of [0, -1, NaN, Infinity, -Infinity, '4', null, undefined]) {
      const result = calculateWallProfiles({ ...base, [field]: value });
      assert.equal(result.status, 'invalid');
      assert.ok(result.errors.some((error) => error.field === field));
      assert.equal('guides' in result, false);
      assert.equal('studs' in result, false);
    }
  });
}

test('rejects unsupported spacing values', () => {
  for (const studSpacingCm of [0, -40, 50, 0.6, '60', null, undefined, NaN, Infinity]) {
    const result = calculateWallProfiles({ ...base, studSpacingCm });
    assert.equal(result.status, 'invalid');
    assert.equal(result.errors[0].code, 'invalid-spacing');
  }
});

test('reports all invalid required fields together', () => {
  const result = calculateWallProfiles({ ...base, length: 0, height: 0, studSpacingCm: 50 });
  assert.equal(result.status, 'invalid');
  assert.deepEqual(result.errors.map((error) => error.field), ['length', 'height', 'studSpacingCm']);
});

test('supports a height of exactly 3 m', () => {
  assert.equal(calculateWallProfiles({ ...base, height: 3 }).status, 'valid');
});

test('does not calculate walls higher than 3 m', () => {
  assert.deepEqual(calculateWallProfiles({ ...base, height: 3.01 }), {
    status: 'unsupported', reasons: ['height-above-3m'],
  });
});

for (const opening of [door, window]) {
  test(`does not calculate walls containing a ${opening.type}`, () => {
    assert.deepEqual(calculateWallProfiles({ ...base, openings: [opening] }), {
      status: 'unsupported', reasons: ['openings-require-additional-rules'],
    });
  });
}

test('reports height and openings limitations together without quantities', () => {
  assert.deepEqual(calculateWallProfiles({ ...base, height: 4, openings: [door, window] }), {
    status: 'unsupported', reasons: ['height-above-3m', 'openings-require-additional-rules'],
  });
});

test('requires an explicit openings list', () => {
  for (const openings of [undefined, null, {}]) {
    const result = calculateWallProfiles({ ...base, openings });
    assert.equal(result.status, 'invalid');
    assert.equal(result.errors[0].code, 'invalid-openings');
  }
});

test('includes both ends on walls shorter than the spacing', () => {
  const result = calculateWallProfiles({ ...base, length: 0.2 });
  assert.equal(result.status, 'valid');
  assert.equal(result.studs.quantity, 2);
});

test('rounds up just beyond a commercial guide length and a spacing multiple', () => {
  const result = calculateWallProfiles({ ...base, length: 3.001 });
  assert.equal(result.status, 'valid');
  assert.equal(result.guides.quantity, 3);
  assert.equal(result.studs.quantity, 7);
});

test('rejects quantities beyond the safe numeric range', () => {
  for (const length of [Number.MAX_VALUE, Number.MAX_SAFE_INTEGER]) {
    const result = calculateWallProfiles({ ...base, length });
    assert.equal(result.status, 'invalid');
    assert.equal(result.errors[0].code, 'quantity-out-of-range');
    assert.equal('guides' in result, false);
    assert.equal('studs' in result, false);
  }
});

test('does not mutate the input and returns repeatable results', () => {
  const input = Object.freeze({ ...base, openings: Object.freeze([]) });
  assert.deepEqual(calculateWallProfiles(input), calculateWallProfiles(input));
  assert.deepEqual(input, base);
});
