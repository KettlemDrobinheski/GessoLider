import type { AreaSummary, ServiceMeasurements } from './measurements';

export type BoardType = 'ST' | 'RU' | 'RF';
export type ProfileWidth = 48 | 70 | 90;
export type WallSides = 1 | 2;
export type InsulationType = 'glass-wool' | 'rock-wool';

export type WallConfigurationDraft = {
  boardType: BoardType | null;
  profileWidth: ProfileWidth | null;
  sides: WallSides | null;
  hasInsulation: boolean;
  insulationType: InsulationType | null;
};

export type WallConfiguration = {
  boardType: BoardType;
  boardDimensions: { width: number; height: number };
  profileWidth: ProfileWidth;
  guideLength: number;
  studLength: number;
  sides: WallSides;
  insulation: InsulationType | null;
};

export type WallMeasurements = Extract<ServiceMeasurements, { service: 'wall' }> & {
  areas: { [Key in keyof AreaSummary]: number };
};

export type WallBudgetInput = {
  measurements: WallMeasurements;
  configuration: WallConfiguration;
};
