import { wasteOptions } from '../constants/wall-configuration';
import { calculateWoodWallCladding } from '../domain/calculations/woodWallCladding';
import type { WoodWallCladdingBudgetInput, WoodWallCladdingMeasurements } from '../types/wood-wall-cladding';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readMeasurements(value: unknown): WoodWallCladdingMeasurements | null {
  if (!isRecord(value) || value.service !== 'lining' || typeof value.width !== 'number' || typeof value.height !== 'number') return null;
  const measurements: WoodWallCladdingMeasurements = { service: 'lining', width: value.width, height: value.height };
  if (calculateWoodWallCladding({ ...measurements, wastePercent: 0 }).status !== 'valid') return null;
  return measurements;
}

export function parseWoodWallCladdingMeasurements(parameter: string | string[] | undefined): WoodWallCladdingMeasurements | null {
  if (typeof parameter !== 'string') return null;
  try { return readMeasurements(JSON.parse(parameter)); } catch { return null; }
}

export function parseWoodWallCladdingBudgetInput(parameter: string | string[] | undefined): WoodWallCladdingBudgetInput | null {
  if (typeof parameter !== 'string') return null;
  try {
    const data: unknown = JSON.parse(parameter);
    if (!isRecord(data) || !isRecord(data.configuration)) return null;
    const measurements = readMeasurements(data.measurements);
    const configurationData = data.configuration;
    const waste = wasteOptions.find((option) => option.value === configurationData.wastePercent);
    if (!measurements || !waste) return null;
    const configuration = { wastePercent: waste.value };
    if (calculateWoodWallCladding({ ...measurements, ...configuration }).status !== 'valid') return null;
    return { measurements, configuration };
  } catch { return null; }
}
