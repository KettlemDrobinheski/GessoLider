import type { BoardType, InsulationType, ProfileWidth, WallSides } from '../types/wall-configuration';

export const boardDimensions = { width: 1.2, height: 1.8 } as const;
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

export const sidesOptions: readonly { value: WallSides; label: string }[] = [
  { value: 1, label: 'Um lado' },
  { value: 2, label: 'Dois lados' },
];

export const insulationChoices = [
  { value: false, label: 'Não' },
  { value: true, label: 'Sim' },
] as const;

export const insulationOptions: readonly { value: InsulationType; label: string }[] = [
  { value: 'glass-wool', label: 'Lã de vidro' },
  { value: 'rock-wool', label: 'Lã de rocha' },
];
