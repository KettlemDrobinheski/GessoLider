import type { CeilingConfiguration } from '../types/ceiling';

export const ceilingSpacingOptions: readonly { value: CeilingConfiguration['spacingCm']; label: string }[] = [
  { value: 40, label: '40 cm' }, { value: 60, label: '60 cm' },
];
export const ceilingWasteOptions: readonly { value: CeilingConfiguration['wastePercent']; label: string }[] = [
  { value: 0, label: '0%' }, { value: 5, label: '5%' }, { value: 10, label: '10%' },
];
export const ceilingMaterials = {
  board: { width: 1.2, height: 1.8, area: 2.16 },
  profileLength: 3,
  screwsPerSquareMeter: 15,
  screwsPerBox: 1000,
  tapePerSquareMeter: 1.4,
  compoundPerSquareMeter: 0.5,
} as const;
