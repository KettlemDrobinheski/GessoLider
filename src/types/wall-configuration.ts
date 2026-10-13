import type { AreaSummary, ServiceMeasurements } from './measurements';

export type BoardType = 'ST' | 'RU' | 'RF';
export type ProfileWidth = 48 | 70 | 90;
export type StudSpacingCm = 40 | 60;
export type WallSides = 1 | 2;
export type WastePercent = 0 | 5 | 10;
export type InsulationType = 'glass-wool' | 'rock-wool';

export type WallConfigurationDraft = {
  boardType: BoardType | null;
  profileWidth: ProfileWidth | null;
  studSpacingCm: StudSpacingCm | null;
  sides: WallSides | null;
  wastePercent: WastePercent | null;
  hasInsulation: boolean;
  insulationType: InsulationType | null;
  acousticBand: boolean | null;
};

export type WallConfiguration = {
  boardType: BoardType;
  boardDimensions: { width: number; height: number };
  profileWidth: ProfileWidth;
  studSpacingCm: StudSpacingCm;
  guideLength: number;
  studLength: number;
  sides: WallSides;
  wastePercent: WastePercent;
  insulation: InsulationType | null;
  acousticBand: boolean;
};

export type WallMeasurements = Extract<ServiceMeasurements, { service: 'wall' }> & {
  areas: { [Key in keyof AreaSummary]: number };
};

export type WallBudgetInput = {
  measurements: WallMeasurements;
  configuration: WallConfiguration;
};
