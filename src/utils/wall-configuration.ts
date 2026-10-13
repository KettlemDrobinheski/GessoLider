import { boardDimensions, boardOptions, insulationOptions, profileLength, profileOptions, sidesOptions, studSpacingOptions } from '../constants/wall-configuration';
import type { WallBudgetInput, WallConfiguration, WallConfigurationDraft, WallMeasurements } from '../types/wall-configuration';
import type { OpeningDraft } from '../types/measurements';
import { validateMeasurements } from './measurements';

export function buildWallConfiguration(draft: WallConfigurationDraft): WallConfiguration | null {
  if (draft.boardType === null || draft.profileWidth === null || draft.studSpacingCm === null || draft.sides === null) return null;
  if (draft.hasInsulation && draft.insulationType === null) return null;

  return {
    boardType: draft.boardType,
    boardDimensions: { ...boardDimensions },
    profileWidth: draft.profileWidth,
    studSpacingCm: draft.studSpacingCm,
    guideLength: profileLength,
    studLength: profileLength,
    sides: draft.sides,
    insulation: draft.hasInsulation ? draft.insulationType : null,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isPositiveNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

export function parseWallMeasurements(parameter: string | string[] | undefined): WallMeasurements | null {
  if (typeof parameter !== 'string') return null;

  try {
    const data: unknown = JSON.parse(parameter);
    if (!isRecord(data) || data.service !== 'wall' || !isPositiveNumber(data.length)
      || !isPositiveNumber(data.height) || !Array.isArray(data.openings) || !isRecord(data.areas)) return null;

    const openings: OpeningDraft[] = [];
    const ids = new Set<string>();
    for (const opening of data.openings) {
      if (!isRecord(opening) || typeof opening.id !== 'string' || ids.has(opening.id)
        || (opening.type !== 'door' && opening.type !== 'window')
        || !isPositiveNumber(opening.width) || !isPositiveNumber(opening.height)
        || typeof opening.quantity !== 'number' || !Number.isSafeInteger(opening.quantity) || opening.quantity < 1) return null;
      ids.add(opening.id);
      openings.push({
        id: opening.id, type: opening.type, width: String(opening.width),
        height: String(opening.height), quantity: String(opening.quantity),
      });
    }

    const validation = validateMeasurements('wall', {
      length: String(data.length), height: String(data.height), width: '', depth: '',
    }, openings.length > 0, openings);
    const { value, areas } = validation;
    if (value?.service !== 'wall' || !areas || areas.gross === null || areas.openings === null || areas.net === null) return null;
    const validatedAreas = { gross: areas.gross, openings: areas.openings, net: areas.net };

    for (const key of ['gross', 'openings', 'net'] as const) {
      const area = data.areas[key];
      if (typeof area !== 'number' || !Number.isFinite(area) || area < 0
        || Math.abs(area - validatedAreas[key]) > Number.EPSILON * Math.max(area, validatedAreas[key], 1) * 8) return null;
    }

    return { ...value, areas: validatedAreas };
  } catch {
    return null;
  }
}

export function parseWallBudgetInput(parameter: string | string[] | undefined): WallBudgetInput | null {
  if (typeof parameter !== 'string') return null;

  try {
    const data: unknown = JSON.parse(parameter);
    if (!isRecord(data) || !isRecord(data.configuration)) return null;
    const measurements = parseWallMeasurements(JSON.stringify(data.measurements));
    const configuration = data.configuration;
    const board = boardOptions.find((option) => option.value === configuration.boardType);
    const profile = profileOptions.find((option) => option.value === configuration.profileWidth);
    const spacing = studSpacingOptions.find((option) => option.value === configuration.studSpacingCm);
    const sides = sidesOptions.find((option) => option.value === configuration.sides);
    const insulation = insulationOptions.find((option) => option.value === configuration.insulation);
    if (!measurements || !board || !profile || !spacing || !sides
      || (configuration.insulation !== null && !insulation)
      || !isRecord(configuration.boardDimensions)
      || configuration.boardDimensions.width !== boardDimensions.width
      || configuration.boardDimensions.height !== boardDimensions.height
      || configuration.guideLength !== profileLength || configuration.studLength !== profileLength) return null;

    return {
      measurements,
      configuration: {
        boardType: board.value, boardDimensions: { ...boardDimensions }, profileWidth: profile.value,
        studSpacingCm: spacing.value, guideLength: profileLength, studLength: profileLength,
        sides: sides.value, insulation: insulation?.value ?? null,
      },
    };
  } catch {
    return null;
  }
}
