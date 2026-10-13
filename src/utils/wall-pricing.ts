import type { WallPricingInput } from '../types/wall-pricing';
import { toCents } from './currency';

export function parseWallPricingInput(parameter: string | string[] | undefined): WallPricingInput | null {
  if (typeof parameter !== 'string') return null;
  try {
    const data: unknown = JSON.parse(parameter);
    if (!data || typeof data !== 'object' || Array.isArray(data)) return null;
    const values = data as Record<string, unknown>;
    if (typeof values.laborRate !== 'number' || values.laborRate <= 0 || toCents(values.laborRate) === null
      || typeof values.materialsTotal !== 'number' || toCents(values.materialsTotal) === null
      || typeof values.notes !== 'string') return null;
    return { laborRate: values.laborRate, materialsTotal: values.materialsTotal, notes: values.notes };
  } catch {
    return null;
  }
}
