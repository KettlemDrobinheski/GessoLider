import type { WallMeasurements } from '../../types/wall-configuration';
import type { WallPricing, WallPricingInput } from '../../types/wall-pricing';
import { toCents } from '../../utils/currency';
import { calculateWallArea } from './wallAreas';

export function calculateWallLabor(measurements: Pick<WallMeasurements, 'length' | 'height'>, laborRate: number): { billingArea: number; laborTotal: number } | null {
  const rateCents = toCents(laborRate);
  const billingArea = calculateWallArea(measurements);
  if (rateCents === null || rateCents <= 0 || billingArea === null) return null;
  const laborCents = Math.round(billingArea * rateCents);
  if (!Number.isFinite(billingArea) || billingArea <= 0 || !Number.isSafeInteger(laborCents)) return null;
  return { billingArea, laborTotal: laborCents / 100 };
}

export function calculateBudgetTotal(materialsTotal: number, laborTotal: number): number | null {
  const materialCents = toCents(materialsTotal);
  const laborCents = toCents(laborTotal);
  if (materialCents === null || laborCents === null || !Number.isSafeInteger(materialCents + laborCents)) return null;
  return (materialCents + laborCents) / 100;
}

export function calculateWallPricing(measurements: Pick<WallMeasurements, 'length' | 'height'>, input: WallPricingInput): WallPricing | null {
  const labor = calculateWallLabor(measurements, input.laborRate);
  if (!labor || typeof input.notes !== 'string') return null;
  const total = calculateBudgetTotal(input.materialsTotal, labor.laborTotal);
  return total === null ? null : { ...input, ...labor, total };
}
