import { boardArea, wasteOptions } from '../../constants/wall-configuration';
import { ceilingMaterials } from '../../constants/ceiling';
import { wallConsumptionCoefficients } from './wallConsumables';
import type { WoodWallCladdingInput, WoodWallCladdingMeasurements } from '../../types/wood-wall-cladding';
import type { BudgetPricing, BudgetPricingInput } from '../../types/budget-pricing';
import { toCents } from '../../utils/currency';

export type WoodWallCladdingValidResult = {
  status: 'valid'; area: number; areaWithWaste: number; wastePercent: WoodWallCladdingInput['wastePercent'];
  boards: number; screws: number; screwBoxes: number; tapeMeters: number; compoundKg: number;
};
export type WoodWallCladdingResult = WoodWallCladdingValidResult | { status: 'invalid'; message: string };

function roundUp(value: number): number {
  const nearest = Math.round(value);
  // Evita uma unidade extra por erro binário em um múltiplo exato.
  return nearest > 0 && Math.abs(value - nearest) <= Number.EPSILON * Math.max(value, 1) * 8
    ? nearest : Math.ceil(value);
}

function calculateArea({ width, height }: Pick<WoodWallCladdingMeasurements, 'width' | 'height'>): number | null {
  if (!Number.isFinite(width) || width <= 0 || !Number.isFinite(height) || height <= 0) return null;
  const area = width * height;
  return Number.isFinite(area) && area > 0 ? area : null;
}

export function calculateWoodWallCladding(input: WoodWallCladdingInput): WoodWallCladdingResult {
  const area = calculateArea(input);
  if (area === null || !wasteOptions.some((option) => option.value === input.wastePercent)) {
    return { status: 'invalid', message: 'Informe largura e altura maiores que zero e perda de 0%, 5% ou 10%.' };
  }
  const areaWithWaste = area * (1 + input.wastePercent / 100);
  const boards = roundUp(areaWithWaste / boardArea);
  const screws = roundUp(areaWithWaste * wallConsumptionCoefficients.boardScrewsPerSquareMeter);
  const screwBoxes = roundUp(screws / ceilingMaterials.screwsPerBox);
  const tapeMeters = areaWithWaste * wallConsumptionCoefficients.jointTapeMetersPerSquareMeter;
  const compoundKg = areaWithWaste * wallConsumptionCoefficients.jointCompoundKgPerSquareMeter;
  if ([areaWithWaste, tapeMeters, compoundKg].some((value) => !Number.isFinite(value) || value <= 0)
    || [boards, screws, screwBoxes].some((value) => !Number.isSafeInteger(value) || value < 1)) {
    return { status: 'invalid', message: 'As medidas excedem o intervalo numérico permitido para o revestimento.' };
  }
  return { status: 'valid', area, areaWithWaste, wastePercent: input.wastePercent, boards, screws, screwBoxes, tapeMeters, compoundKg };
}

export function calculateWoodWallCladdingPricing(measurements: WoodWallCladdingMeasurements, input: BudgetPricingInput): BudgetPricing | null {
  const billingArea = calculateArea(measurements);
  const rateCents = toCents(input.laborRate);
  const materialCents = toCents(input.materialsTotal);
  if (billingArea === null || rateCents === null || rateCents <= 0 || materialCents === null || typeof input.notes !== 'string') return null;
  const laborCents = Math.round(billingArea * rateCents);
  const totalCents = laborCents + materialCents;
  if (!Number.isSafeInteger(laborCents) || !Number.isSafeInteger(totalCents)) return null;
  return { ...input, billingArea, laborTotal: laborCents / 100, total: totalCents / 100 };
}
