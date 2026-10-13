import { insulationOptions, wasteOptions } from '../../constants/wall-configuration';
import type { InsulationType, WastePercent } from '../../types/wall-configuration';

export type WallInsulation = { type: InsulationType; baseArea: number; areaWithWaste: number };

export function calculateWallInsulation(wallArea: number, wastePercent: WastePercent, type: InsulationType | null): WallInsulation | null {
  if (type === null || !Number.isFinite(wallArea) || wallArea <= 0
    || !wasteOptions.some((option) => option.value === wastePercent)
    || !insulationOptions.some((option) => option.value === type)) return null;
  const areaWithWaste = wallArea * (1 + wastePercent / 100);
  if (!Number.isFinite(areaWithWaste) || areaWithWaste <= 0) return null;
  return { type, baseArea: wallArea, areaWithWaste };
}
