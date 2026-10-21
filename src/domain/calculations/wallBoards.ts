import { boardArea, boardDimensionLabel, boardDimensions, boardOptions, sidesOptions, wasteOptions } from '../../constants/wall-configuration';
import type { WallConfiguration } from '../../types/wall-configuration';
import { calculateWallProfiles } from './wallProfiles';
import type { WallProfilesInput, WallProfilesUnsupportedResult, WallProfilesValidationError } from './wallProfiles';
import { calculateCoveringArea, calculateWallArea } from './wallAreas';

export type WallBoardsInput = WallProfilesInput
  & Pick<WallConfiguration, 'boardType' | 'boardDimensions' | 'sides' | 'wastePercent'>;

export type WallBoardsValidationError = WallProfilesValidationError | {
  field: 'boardType' | 'boardDimensions' | 'sides' | 'wastePercent' | 'length';
  code: 'invalid-board-type' | 'invalid-board-dimensions' | 'invalid-sides' | 'invalid-waste' | 'area-out-of-range';
  message: string;
};

export type WallBoardsInvalidResult = { status: 'invalid'; errors: WallBoardsValidationError[] };

export type WallBoardsValidResult = {
  status: 'valid';
  wallArea: number;
  sides: WallConfiguration['sides'];
  coveringArea: number;
  wastePercent: WallConfiguration['wastePercent'];
  areaWithWaste: number;
  boards: {
    type: WallConfiguration['boardType'];
    dimensions: WallConfiguration['boardDimensions'];
    area: number;
    quantity: number;
  };
};

export type WallBoardsResult = WallBoardsValidResult | WallBoardsInvalidResult | WallProfilesUnsupportedResult;

export function calculateWallBoards(input: WallBoardsInput): WallBoardsResult {
  const profiles = calculateWallProfiles(input);
  const errors: WallBoardsValidationError[] = profiles.status === 'invalid' ? [...profiles.errors] : [];
  if (!boardOptions.some((option) => option.value === input.boardType)) {
    errors.push({ field: 'boardType', code: 'invalid-board-type', message: 'Selecione uma placa ST, RU ou RF.' });
  }
  if (input.boardDimensions?.width !== boardDimensions.width || input.boardDimensions?.height !== boardDimensions.height) {
    errors.push({ field: 'boardDimensions', code: 'invalid-board-dimensions', message: `Esta versão utiliza placas de ${boardDimensionLabel}.` });
  }
  if (!sidesOptions.some((option) => option.value === input.sides)) {
    errors.push({ field: 'sides', code: 'invalid-sides', message: 'Selecione a aplicação em um ou dois lados.' });
  }
  if (!wasteOptions.some((option) => option.value === input.wastePercent)) {
    errors.push({ field: 'wastePercent', code: 'invalid-waste', message: 'Selecione uma margem de perda de 0%, 5% ou 10%.' });
  }
  if (errors.length > 0) return { status: 'invalid', errors };
  if (profiles.status === 'unsupported') return profiles;

  const wallArea = calculateWallArea(input);
  const coveringArea = wallArea === null ? null : calculateCoveringArea(wallArea, input.sides);
  if (wallArea === null || coveringArea === null) {
    return { status: 'invalid', errors: [{ field: 'length', code: 'area-out-of-range', message: 'Revise as medidas: a área está fora do intervalo permitido.' }] };
  }
  const areaWithWaste = coveringArea * (1 + input.wastePercent / 100);
  const boardCount = areaWithWaste / boardArea;
  const nearestInteger = Math.round(boardCount);
  // Evita uma placa extra quando um múltiplo exato acumula erro de ponto flutuante.
  const quantity = nearestInteger > 0 && Math.abs(boardCount - nearestInteger) <= Number.EPSILON * Math.max(boardCount, 1) * 8
    ? nearestInteger : Math.ceil(boardCount);
  if (!Number.isFinite(areaWithWaste) || areaWithWaste <= 0 || !Number.isSafeInteger(quantity) || quantity < 1) {
    return { status: 'invalid', errors: [{ field: 'length', code: 'area-out-of-range', message: 'As medidas excedem o intervalo numérico permitido para o cálculo de placas.' }] };
  }

  return {
    status: 'valid', wallArea, sides: input.sides, coveringArea, wastePercent: input.wastePercent, areaWithWaste,
    boards: { type: input.boardType, dimensions: { ...boardDimensions }, area: boardArea, quantity },
  };
}
