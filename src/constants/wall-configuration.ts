import type { BoardType, InsulationType, ProfileWidth, StudSpacingCm, WallSides, WastePercent } from '../types/wall-configuration';

export const boardDimensions = { width: 1.2, height: 1.8 } as const;
export const boardArea = boardDimensions.width * boardDimensions.height;
export const boardDimensionLabel = '1,20 × 1,80 m';
export const profileLength = 3;
export const profileLengthLabel = '3,00 m';

export const boardOptions: readonly { value: BoardType; label: string }[] = [
  { value: 'ST', label: 'Standard (ST)' },
  { value: 'RU', label: 'Resistente à Umidade (RU)' },
  { value: 'RF', label: 'Resistente ao Fogo (RF)' },
];

export const profileOptions: readonly { value: ProfileWidth; label: string }[] = [
  { value: 48, label: '48 mm' },
  { value: 70, label: '70 mm' },
  { value: 90, label: '90 mm' },
];

export const studSpacingOptions: readonly { value: StudSpacingCm; label: string }[] = [
  { value: 40, label: '40 cm' },
  { value: 60, label: '60 cm' },
];

export const sidesOptions: readonly { value: WallSides; label: string }[] = [
  { value: 1, label: 'Um lado' },
  { value: 2, label: 'Dois lados' },
];

export const wasteOptions: readonly { value: WastePercent; label: string }[] = [
  { value: 0, label: '0%' },
  { value: 5, label: '5%' },
  { value: 10, label: '10%' },
];

export const insulationOptions: readonly { value: InsulationType; label: string }[] = [
  { value: 'glass-wool', label: 'Lã de vidro' },
  { value: 'rock-wool', label: 'Lã de rocha' },
];

export const internalInsulationOptions: readonly { value: InsulationType | null; label: string }[] = [
  { value: null, label: 'Sem isolamento' },
  ...insulationOptions,
];

export const acousticBandOptions = [
  { value: true, label: 'Sim' },
  { value: false, label: 'Não' },
] as const;
