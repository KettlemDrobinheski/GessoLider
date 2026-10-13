import type { WallMeasurements, WallSides } from '../../types/wall-configuration';

export function calculateWallArea({ length, height }: Pick<WallMeasurements, 'length' | 'height'>): number | null {
  if (!Number.isFinite(length) || length <= 0 || !Number.isFinite(height) || height <= 0) return null;
  const area = length * height;
  return Number.isFinite(area) && area > 0 ? area : null;
}

export function calculateCoveringArea(wallArea: number, sides: WallSides): number | null {
  if (!Number.isFinite(wallArea) || wallArea <= 0 || (sides !== 1 && sides !== 2)) return null;
  const area = wallArea * sides;
  return Number.isFinite(area) && area > 0 ? area : null;
}
