import { boardArea } from '../../constants/wall-configuration';
import { ceilingMaterials, ceilingSpacingOptions, ceilingWasteOptions } from '../../constants/ceiling';
import type { CeilingInput } from '../../types/ceiling';

export type CeilingValidResult = {
  status: 'valid'; area: number; areaWithWaste: number; spacingCm: 40 | 60; wastePercent: 0 | 5 | 10;
  boards: number; profileLines: number; profileMeters: number; profileMetersWithWaste: number;
  profilesPerLine: number; profiles: number;
  perimeter: number; angleMetersWithWaste: number; anglePiecesBySide: [number, number, number, number]; angles: number;
  screws: number; screwBoxes: number; tapeMeters: number; compoundKg: number;
};
export type CeilingResult = CeilingValidResult | { status: 'invalid'; message: string };

function roundUp(value: number): number {
  const nearest = Math.round(value);
  // Não acrescenta uma peça por erro binário em um múltiplo exato.
  return nearest > 0 && Math.abs(value - nearest) <= Number.EPSILON * Math.max(value, 1) * 8
    ? nearest : Math.ceil(value);
}

export function calculateCeiling(input: CeilingInput): CeilingResult {
  if (!Number.isFinite(input.length) || input.length <= 0 || !Number.isFinite(input.width) || input.width <= 0
    || !ceilingSpacingOptions.some((option) => option.value === input.spacingCm)
    || !ceilingWasteOptions.some((option) => option.value === input.wastePercent)) {
    return { status: 'invalid', message: 'Informe medidas maiores que zero, espaçamento de 40 ou 60 cm e perda de 0%, 5% ou 10%.' };
  }
  const area = input.length * input.width;
  const factor = 1 + input.wastePercent / 100;
  const areaWithWaste = area * factor;
  const boards = roundUp(areaWithWaste / boardArea);
  const profileLines = roundUp(input.width / (input.spacingCm / 100)) + 1;
  const profileMeters = profileLines * input.length;
  const profileMetersWithWaste = profileMeters * factor;
  const profilesPerLine = roundUp(input.length / ceilingMaterials.profileLength);
  const profilesBeforeWaste = profileLines * profilesPerLine;
  const profiles = roundUp(profilesBeforeWaste * factor);
  const perimeter = (input.length + input.width) * 2;
  const angleMetersWithWaste = perimeter * factor;
  const anglePiecesBySide: [number, number, number, number] = [input.length, input.width, input.length, input.width]
    .map((side) => roundUp(side / ceilingMaterials.profileLength)) as [number, number, number, number];
  const anglesBeforeWaste = anglePiecesBySide.reduce((total, pieces) => total + pieces, 0);
  const angles = roundUp(anglesBeforeWaste * factor);
  const screws = roundUp(areaWithWaste * ceilingMaterials.screwsPerSquareMeter);
  const screwBoxes = roundUp(screws / ceilingMaterials.screwsPerBox);
  const tapeMeters = areaWithWaste * ceilingMaterials.tapePerSquareMeter;
  const compoundKg = areaWithWaste * ceilingMaterials.compoundPerSquareMeter;
  const lengths = [area, areaWithWaste, profileMeters, profileMetersWithWaste, perimeter, angleMetersWithWaste, tapeMeters, compoundKg];
  const quantities = [boards, profileLines, profilesPerLine, profiles, ...anglePiecesBySide, angles, screws, screwBoxes];
  if (lengths.some((value) => !Number.isFinite(value) || value <= 0)
    || quantities.some((value) => !Number.isSafeInteger(value) || value < 1)) {
    return { status: 'invalid', message: 'As medidas excedem o intervalo numérico permitido para o cálculo do forro.' };
  }
  return {
    status: 'valid', area, areaWithWaste, spacingCm: input.spacingCm, wastePercent: input.wastePercent,
    boards, profileLines, profileMeters, profileMetersWithWaste, profilesPerLine, profiles, perimeter,
    angleMetersWithWaste, anglePiecesBySide, angles, screws, screwBoxes, tapeMeters, compoundKg,
  };
}
