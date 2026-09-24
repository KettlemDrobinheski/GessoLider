import assert from 'node:assert/strict';
import test from 'node:test';
import { formatArea, parsePositiveDecimal, parseQuantity, validateMeasurements } from '../src/utils/measurements.ts';

const dimensions = { length: '4,00', height: '2,70', width: '', depth: '' };
const door = { id: 'door-1', type: 'door', width: '0,80', height: '2,10', quantity: '1' };

test('accepts decimal comma and dot, rejecting malformed and nonpositive measurements', () => {
  for (const input of ['2,50', '2.50', ' 2,50 ']) assert.equal(parsePositiveDecimal(input), 2.5);
  for (const input of ['', ' ', '0', '-2', 'abc', '2,5.0', '1e3', 'Infinity', '1,', '1.000,50']) {
    assert.equal(parsePositiveDecimal(input), null, input);
  }
});

test('requires a positive integer quantity', () => {
  assert.equal(parseQuantity('2'), 2);
  for (const input of ['', '0', '-1', '1,5', '1.5', '2.0', '9007199254740992']) assert.equal(parseQuantity(input), null);
});

test('calculates only the geometric area and formats it in Brazilian Portuguese', () => {
  const result = validateMeasurements('wall', dimensions, false, []);
  assert.equal(result.areas.gross, 10.8);
  assert.equal(result.areas.net, 10.8);
  assert.equal(result.areas.openings, 0);
  assert.equal(formatArea(result.areas.gross), '10,80 m²');
  assert.deepEqual(result.value, { service: 'wall', length: 4, height: 2.7, openings: [] });
});

test('sums doors and windows with their quantities and subtracts openings once', () => {
  const window = { id: 'window-1', type: 'window', width: '1.20', height: '1', quantity: '2' };
  const result = validateMeasurements('wall', dimensions, true, [door, window]);
  assert.equal(formatArea(result.areas.openings), '4,08 m²');
  assert.equal(formatArea(result.areas.net), '6,72 m²');
  assert.equal(result.value.openings.length, 2);
});

test('removing an opening updates the areas; removing the last requires an opening or No', () => {
  const list = [door, { ...door, id: 'door-2' }];
  const result = validateMeasurements('wall', dimensions, true, list.filter((item) => item.id !== 'door-2'));
  assert.equal(formatArea(result.areas.openings), '1,68 m²');
  const empty = validateMeasurements('wall', dimensions, true, []);
  assert.equal(empty.value, null);
  assert.ok(empty.openingsMessage);
});

test('No excludes retained openings and their validation errors from the payload', () => {
  const result = validateMeasurements('wall', dimensions, false, [{ ...door, width: '' }]);
  assert.equal(result.areas.openings, 0);
  assert.deepEqual(result.value.openings, []);
});

test('invalid openings block continuation and never produce a misleading net area', () => {
  const result = validateMeasurements('wall', dimensions, true, [{ ...door, width: '', height: '0', quantity: '1,5' }]);
  assert.equal(result.value, null);
  assert.equal(Object.keys(result.openings[door.id]).length, 3);
  assert.equal(result.areas.openings, null);
  assert.equal(result.areas.net, null);
});

test('openings larger than the wall show an error, clamp net to zero, and block continuation', () => {
  const result = validateMeasurements('wall', dimensions, true, [{ ...door, width: '6', height: '3' }]);
  assert.equal(result.value, null);
  assert.ok(result.areaMessage);
  assert.equal(result.areas.net, 0);
});

test('equal areas do not fail because of floating point rounding', () => {
  const result = validateMeasurements('wall', { ...dimensions, length: '0.3', height: '1' }, true,
    [{ ...door, width: '0.1', height: '1', quantity: '3' }]);
  assert.ok(result.value);
  assert.equal(result.areas.net, 0);
});

test('empty, zero or invalid required dimensions block continuation', () => {
  for (const length of ['', '0', '-4', 'texto']) {
    const result = validateMeasurements('wall', { ...dimensions, length }, false, []);
    assert.equal(result.value, null);
    assert.ok(result.fields.length);
    assert.equal(result.areas.gross, null);
  }
});

test('ceiling and lining use their own geometric dimensions without wall openings', () => {
  const ceiling = validateMeasurements('ceiling', { ...dimensions, height: '', width: '3' }, true, [door]);
  assert.deepEqual(ceiling.value, { service: 'ceiling', length: 4, width: 3 });
  assert.equal(ceiling.areas.gross, 12);
  const lining = validateMeasurements('lining', dimensions, false, []);
  assert.deepEqual(lining.value, { service: 'lining', length: 4, height: 2.7 });
});

test('details require depth but do not assume an area formula', () => {
  assert.equal(validateMeasurements('details', dimensions, false, []).value, null);
  const result = validateMeasurements('details', { ...dimensions, depth: '0,30' }, false, []);
  assert.equal(result.areas, null);
  assert.deepEqual(result.value, { service: 'details', length: 4, height: 2.7, depth: 0.3 });
});

test('rejects overflow instead of displaying infinite areas', () => {
  const huge = '9'.repeat(200);
  const result = validateMeasurements('wall', { ...dimensions, length: huge, height: huge }, false, []);
  assert.equal(result.value, null);
  assert.equal(result.areas.gross, null);
  assert.ok(result.areaMessage);
});
