import assert from 'node:assert/strict';
import test from 'node:test';
import './register-typescript.mjs';

const { calculateWallBoards } = await import('../src/domain/calculations/wallBoards.ts');
const base = {
  length: 4, height: 2.7, openings: [], studSpacingCm: 60,
  boardType: 'ST', boardDimensions: { width: 1.2, height: 1.8 }, sides: 2, wastePercent: 0,
};

function close(actual, expected) {
  assert.ok(Math.abs(actual - expected) < 1e-10, `${actual} != ${expected}`);
}

for (const example of [
  { sides: 1, wastePercent: 0, coveringArea: 10.8, areaWithWaste: 10.8, quantity: 5 },
  { sides: 2, wastePercent: 0, coveringArea: 21.6, areaWithWaste: 21.6, quantity: 10 },
  { sides: 2, wastePercent: 5, coveringArea: 21.6, areaWithWaste: 22.68, quantity: 11 },
  { sides: 2, wastePercent: 10, coveringArea: 21.6, areaWithWaste: 23.76, quantity: 11 },
]) {
  test(`calculates 4 x 2.7 m, ${example.sides} sides, ${example.wastePercent}% waste`, () => {
    const result = calculateWallBoards({ ...base, sides: example.sides, wastePercent: example.wastePercent });
    assert.equal(result.status, 'valid');
    close(result.wallArea, 10.8);
    close(result.coveringArea, example.coveringArea);
    close(result.areaWithWaste, example.areaWithWaste);
    close(result.boards.area, 2.16);
    assert.equal(result.sides, example.sides);
    assert.equal(result.wastePercent, example.wastePercent);
    assert.equal(result.boards.quantity, example.quantity);
  });
}

for (const boardType of ['ST', 'RU', 'RF']) {
  test(`preserves ${boardType} and the provided board dimensions`, () => {
    const result = calculateWallBoards({ ...base, boardType });
    assert.equal(result.status, 'valid');
    assert.equal(result.boards.type, boardType);
    assert.deepEqual(result.boards.dimensions, { width: 1.2, height: 1.8 });
    assert.equal(result.boards.quantity, 10);
  });
}

for (const [field, values] of [
  ['wastePercent', [-1, 1, 15, NaN, Infinity, '5', null, undefined]],
  ['sides', [0, 3, -1, 1.5, '2', null, undefined]],
  ['length', [0, -1, NaN, Infinity, '4', null, undefined]],
  ['height', [0, -1, NaN, Infinity, '2.7', null, undefined]],
  ['boardType', ['', 'XX', null, undefined]],
  ['boardDimensions', [null, undefined, {}, { width: 1.2, height: 2.4 }]],
]) {
  test(`rejects invalid ${field} without material quantities`, () => {
    for (const value of values) {
      const result = calculateWallBoards({ ...base, [field]: value });
      assert.equal(result.status, 'invalid');
      assert.ok(result.errors.some((error) => error.field === field));
      assert.equal('boards' in result, false);
    }
  });
}

test('does not calculate boards for a wall higher than 3 m', () => {
  assert.deepEqual(calculateWallBoards({ ...base, height: 3.01 }), {
    status: 'unsupported', reasons: ['height-above-3m'],
  });
});

test('accepts a height of exactly 3 m', () => {
  assert.equal(calculateWallBoards({ ...base, height: 3 }).status, 'valid');
});

for (const type of ['door', 'window']) {
  test(`does not calculate boards or deduct the area of a ${type}`, () => {
    assert.deepEqual(calculateWallBoards({ ...base, openings: [{ id: type, type, width: 1, height: 1, quantity: 1 }] }), {
      status: 'unsupported', reasons: ['openings-require-additional-rules'],
    });
  });
}

test('rounds up a real fractional requirement beyond an exact multiple', () => {
  const result = calculateWallBoards({ ...base, length: 4.000001 });
  assert.equal(result.status, 'valid');
  assert.equal(result.boards.quantity, 11);
});

test('rounds a very small positive covering area up to one board', () => {
  const result = calculateWallBoards({ ...base, length: 1e-16, height: 1 });
  assert.equal(result.status, 'valid');
  assert.equal(result.boards.quantity, 1);
});

test('rejects areas beyond the safe quantity range', () => {
  const result = calculateWallBoards({ ...base, length: 5000000000000000, height: 3, wastePercent: 10 });
  assert.equal(result.status, 'invalid');
  assert.equal('boards' in result, false);
});

test('does not mutate input or return a shared board dimensions object', () => {
  const input = Object.freeze({ ...base, boardDimensions: Object.freeze({ ...base.boardDimensions }), openings: Object.freeze([]) });
  const first = calculateWallBoards(input);
  assert.deepEqual(first, calculateWallBoards(input));
  first.boards.dimensions.width = 999;
  assert.equal(calculateWallBoards(input).boards.dimensions.width, 1.2);
});
