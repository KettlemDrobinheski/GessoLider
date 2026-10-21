import assert from 'node:assert/strict';
import test from 'node:test';
import './register-typescript.mjs';

const { boardArea, boardDimensions, boardDimensionLabel, profileLength } = await import('../src/constants/wall-configuration.ts');
const { ceilingMaterials } = await import('../src/constants/ceiling.ts');

test('shares the same drywall board dimensions and derived area across services', () => {
  assert.deepEqual(boardDimensions, { width: 1.2, height: 1.8 });
  assert.equal(boardArea, 2.16);
  assert.equal(boardArea, boardDimensions.width * boardDimensions.height);
  assert.deepEqual(ceilingMaterials.board, { ...boardDimensions, area: boardArea });
  assert.equal(boardDimensionLabel, '1,20 × 1,80 m');
  assert.equal(profileLength, 3);
  assert.equal(ceilingMaterials.profileLength, profileLength);
});
