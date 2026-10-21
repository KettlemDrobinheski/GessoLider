import type { Opening } from '../../types/measurements';
import { profileLength } from '../../constants/wall-configuration';
import type { WallConfiguration, WallMeasurements } from '../../types/wall-configuration';

export type WallProfilesInput = Pick<WallMeasurements, 'length' | 'height'>
  & Pick<WallConfiguration, 'studSpacingCm'>
  & { openings: readonly Opening[] };

export type WallProfilesValidResult = {
  status: 'valid';
  guides: { quantity: number; pieceLength: typeof profileLength; totalLength: number };
  studs: { quantity: number; pieceLength: typeof profileLength };
};

export type WallProfilesUnsupportedReason = 'height-above-3m' | 'openings-require-additional-rules';

export type WallProfilesUnsupportedResult = {
  status: 'unsupported';
  reasons: WallProfilesUnsupportedReason[];
};

export type WallProfilesValidationError = {
  field: keyof WallProfilesInput;
  code: 'positive-finite-number-required' | 'invalid-spacing' | 'invalid-openings' | 'quantity-out-of-range';
  message: string;
};

export type WallProfilesInvalidResult = {
  status: 'invalid';
  errors: WallProfilesValidationError[];
};

export type WallProfilesResult = WallProfilesValidResult | WallProfilesUnsupportedResult | WallProfilesInvalidResult;

export function calculateWallProfiles(input: WallProfilesInput): WallProfilesResult {
  const errors: WallProfilesValidationError[] = [];
  for (const field of ['length', 'height'] as const) {
    if (!Number.isFinite(input[field]) || input[field] <= 0) {
      errors.push({ field, code: 'positive-finite-number-required', message: 'Informe uma medida finita maior que zero.' });
    }
  }
  if (input.studSpacingCm !== 40 && input.studSpacingCm !== 60) {
    errors.push({ field: 'studSpacingCm', code: 'invalid-spacing', message: 'Selecione um espaçamento de 40 ou 60 cm.' });
  }
  if (!Array.isArray(input.openings)) {
    errors.push({ field: 'openings', code: 'invalid-openings', message: 'Informe a lista de aberturas, mesmo que vazia.' });
  }
  if (errors.length > 0) return { status: 'invalid', errors };

  const reasons: WallProfilesUnsupportedReason[] = [];
  if (input.height > profileLength) reasons.push('height-above-3m');
  if (input.openings.length > 0) reasons.push('openings-require-additional-rules');
  if (reasons.length > 0) return { status: 'unsupported', reasons };

  const totalGuideLength = input.length * 2;
  const guideQuantity = Math.ceil(totalGuideLength / profileLength);
  const studQuantity = Math.ceil(input.length / (input.studSpacingCm / 100)) + 1;
  if (!Number.isSafeInteger(guideQuantity) || !Number.isSafeInteger(studQuantity)) {
    return {
      status: 'invalid',
      errors: [{ field: 'length', code: 'quantity-out-of-range', message: 'O comprimento excede o intervalo numérico permitido para as quantidades.' }],
    };
  }

  return {
    status: 'valid',
    guides: { quantity: guideQuantity, pieceLength: profileLength, totalLength: totalGuideLength },
    studs: { quantity: studQuantity, pieceLength: profileLength },
  };
}
