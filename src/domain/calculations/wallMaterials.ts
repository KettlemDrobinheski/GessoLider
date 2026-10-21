import { insulationOptions, profileOptions } from '../../constants/wall-configuration';
import type { WallConfiguration } from '../../types/wall-configuration';
import { calculateWallBoards } from './wallBoards';
import type { WallBoardsInput, WallBoardsInvalidResult, WallBoardsValidResult } from './wallBoards';
import { calculateWallProfiles } from './wallProfiles';
import type { WallProfilesUnsupportedResult, WallProfilesValidResult } from './wallProfiles';
import { calculateWallInsulation } from './wallInsulation';
import type { WallInsulation } from './wallInsulation';
import { calculateWallConsumables } from './wallConsumables';
import type { WallConsumables } from './wallConsumables';

export type WallMaterialsInput = WallBoardsInput & Pick<WallConfiguration, 'profileWidth'> & Partial<Pick<WallConfiguration, 'insulation' | 'acousticBand'>>;

export type WallMaterialsCalculationInput = Omit<WallMaterialsInput, 'insulation' | 'acousticBand'> & {
  insulation: WallConfiguration['insulation'];
  acousticBand: WallConfiguration['acousticBand'];
};

export type WallMaterialsValidResult = WallBoardsValidResult & {
  calculationInput: Readonly<WallMaterialsCalculationInput>;
  insulation: WallInsulation | null;
  consumables: WallConsumables;
  guides: WallProfilesValidResult['guides'] & { width: WallConfiguration['profileWidth'] };
  studs: WallProfilesValidResult['studs'] & { width: WallConfiguration['profileWidth']; spacingCm: WallConfiguration['studSpacingCm'] };
};

export type WallMaterialsInvalidResult = {
  status: 'invalid';
  errors: (WallBoardsInvalidResult['errors'][number] | {
    field: 'profileWidth' | 'insulation' | 'acousticBand' | 'length';
    code: 'invalid-profile' | 'invalid-insulation' | 'invalid-acoustic-band' | 'consumables-out-of-range'; message: string;
  })[];
};

export type WallMaterialsResult = WallMaterialsValidResult | WallMaterialsInvalidResult | WallProfilesUnsupportedResult;

export function calculateWallMaterials(input: WallMaterialsInput): WallMaterialsResult {
  const boards = calculateWallBoards(input);
  if (!profileOptions.some((option) => option.value === input.profileWidth)) {
    return { status: 'invalid', errors: [
      ...(boards.status === 'invalid' ? boards.errors : []),
      { field: 'profileWidth', code: 'invalid-profile', message: 'Selecione um perfil de 48, 70 ou 90 mm.' },
    ] };
  }
  if (boards.status !== 'valid') return boards;
  if (input.acousticBand !== undefined && typeof input.acousticBand !== 'boolean') {
    return { status: 'invalid', errors: [{ field: 'acousticBand', code: 'invalid-acoustic-band', message: 'Selecione Sim ou Não para a banda acústica.' }] };
  }
  const consumables = calculateWallConsumables(boards.wallArea, boards.coveringArea, input.acousticBand ?? false);
  if (!consumables) {
    return { status: 'invalid', errors: [{ field: 'length', code: 'consumables-out-of-range', message: 'As medidas excedem o intervalo numérico permitido para os consumíveis.' }] };
  }
  const insulationType = input.insulation ?? null;
  const insulation = calculateWallInsulation(boards.wallArea, input.wastePercent, insulationType);
  if (insulationType !== null && (!insulationOptions.some((option) => option.value === insulationType) || !insulation)) {
    return { status: 'invalid', errors: [{ field: 'insulation', code: 'invalid-insulation', message: 'Revise o tipo de isolamento e as medidas da parede.' }] };
  }
  const profiles = calculateWallProfiles(input);
  if (profiles.status !== 'valid') return profiles;

  const calculationInput: Readonly<WallMaterialsCalculationInput> = Object.freeze({
    length: input.length,
    height: input.height,
    openings: Object.freeze(input.openings.map((opening) => Object.freeze({ ...opening }))),
    studSpacingCm: input.studSpacingCm,
    boardType: input.boardType,
    boardDimensions: Object.freeze({ ...input.boardDimensions }),
    sides: input.sides,
    wastePercent: input.wastePercent,
    profileWidth: input.profileWidth,
    insulation: insulationType,
    acousticBand: input.acousticBand ?? false,
  });

  return {
    ...boards,
    calculationInput,
    insulation,
    consumables,
    guides: { ...profiles.guides, width: input.profileWidth },
    studs: { ...profiles.studs, width: input.profileWidth, spacingCm: input.studSpacingCm },
  };
}
