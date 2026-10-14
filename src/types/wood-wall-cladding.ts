import type { WastePercent } from './wall-configuration';

export type WoodWallCladdingMeasurements = { service: 'lining'; width: number; height: number };
export type WoodWallCladdingConfiguration = { wastePercent: WastePercent };
export type WoodWallCladdingBudgetInput = {
  measurements: WoodWallCladdingMeasurements; configuration: WoodWallCladdingConfiguration;
};
export type WoodWallCladdingInput = Pick<WoodWallCladdingMeasurements, 'width' | 'height'> & WoodWallCladdingConfiguration;
