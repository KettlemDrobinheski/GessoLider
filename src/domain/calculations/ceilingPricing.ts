import type { CeilingMeasurements } from '../../types/ceiling';
import type { BudgetPricing, BudgetPricingInput } from '../../types/budget-pricing';
import { toCents } from '../../utils/currency';

export function calculateCeilingPricing(measurements: CeilingMeasurements, input: BudgetPricingInput): BudgetPricing | null {
  const rateCents = toCents(input.laborRate);
  const materialCents = toCents(input.materialsTotal);
  if (!Number.isFinite(measurements.length) || measurements.length <= 0 || !Number.isFinite(measurements.width)
    || measurements.width <= 0 || rateCents === null || rateCents <= 0 || materialCents === null || typeof input.notes !== 'string') return null;
  const billingArea = measurements.length * measurements.width;
  const laborCents = Math.round(billingArea * rateCents);
  const totalCents = materialCents + laborCents;
  if (!Number.isFinite(billingArea) || billingArea <= 0 || !Number.isSafeInteger(laborCents) || !Number.isSafeInteger(totalCents)) return null;
  return { ...input, billingArea, laborTotal: laborCents / 100, total: totalCents / 100 };
}
