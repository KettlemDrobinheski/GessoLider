export type CeilingMeasurements = { service: 'ceiling'; length: number; width: number };
export type CeilingConfiguration = { spacingCm: 40 | 60; wastePercent: 0 | 5 | 10 };
export type CeilingBudgetInput = { measurements: CeilingMeasurements; configuration: CeilingConfiguration };
export type CeilingInput = Pick<CeilingMeasurements, 'length' | 'width'> & CeilingConfiguration;
