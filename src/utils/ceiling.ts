import { ceilingSpacingOptions, ceilingWasteOptions } from '../constants/ceiling';
import { calculateCeiling } from '../domain/calculations/ceiling';
import type { CeilingBudgetInput, CeilingMeasurements } from '../types/ceiling';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readMeasurements(value: unknown): CeilingMeasurements | null {
  if (!isRecord(value) || value.service !== 'ceiling' || typeof value.length !== 'number'
    || typeof value.width !== 'number' || !Number.isFinite(value.length) || value.length <= 0
    || !Number.isFinite(value.width) || value.width <= 0) return null;
  const area = value.length * value.width;
  if (!Number.isFinite(area) || area <= 0) return null;
  return { service: 'ceiling', length: value.length, width: value.width };
}

export function parseCeilingMeasurements(parameter: string | string[] | undefined): CeilingMeasurements | null {
  if (typeof parameter !== 'string') return null;
  try { return readMeasurements(JSON.parse(parameter)); } catch { return null; }
}

export function parseCeilingBudgetInput(parameter: string | string[] | undefined): CeilingBudgetInput | null {
  if (typeof parameter !== 'string') return null;
  try {
    const data: unknown = JSON.parse(parameter);
    if (!isRecord(data) || !isRecord(data.configuration)) return null;
    const measurements = readMeasurements(data.measurements);
    const configurationData = data.configuration;
    const spacing = ceilingSpacingOptions.find((option) => option.value === configurationData.spacingCm);
    const waste = ceilingWasteOptions.find((option) => option.value === configurationData.wastePercent);
    if (!measurements || !spacing || !waste) return null;
    const configuration = { spacingCm: spacing.value, wastePercent: waste.value };
    if (calculateCeiling({ ...measurements, ...configuration }).status !== 'valid') return null;
    return { measurements, configuration };
  } catch { return null; }
}
