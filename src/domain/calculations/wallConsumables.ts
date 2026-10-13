export const wallConsumptionCoefficients = {
  boardScrewsPerSquareMeter: 15,
  jointTapeMetersPerSquareMeter: 1.4,
  jointCompoundKgPerSquareMeter: 0.5,
  acousticBandMetersPerSquareMeter: 0.9,
} as const;

export type WallConsumables = {
  boardScrews: { quantity: number };
  metalScrews: { status: 'to-define' };
  jointTape: { meters: number };
  jointCompound: { kilograms: number };
  acousticBand: { meters: number; method: 'area-coefficient' } | null;
};

export function calculateWallConsumables(wallArea: number, coveringArea: number, acousticBand: boolean): WallConsumables | null {
  if (!Number.isFinite(wallArea) || wallArea <= 0 || !Number.isFinite(coveringArea) || coveringArea <= 0
    || typeof acousticBand !== 'boolean') return null;
  const rawScrews = coveringArea * wallConsumptionCoefficients.boardScrewsPerSquareMeter;
  const nearestInteger = Math.round(rawScrews);
  // Um erro de ponto flutuante em um inteiro exato não deve acrescentar um parafuso.
  const screws = nearestInteger > 0 && Math.abs(rawScrews - nearestInteger) <= Number.EPSILON * Math.max(rawScrews, 1) * 8
    ? nearestInteger : Math.ceil(rawScrews);
  const tape = coveringArea * wallConsumptionCoefficients.jointTapeMetersPerSquareMeter;
  const compound = coveringArea * wallConsumptionCoefficients.jointCompoundKgPerSquareMeter;
  const band = acousticBand ? wallArea * wallConsumptionCoefficients.acousticBandMetersPerSquareMeter : null;
  if (!Number.isSafeInteger(screws) || screws < 1 || !Number.isFinite(tape) || !Number.isFinite(compound)
    || (band !== null && !Number.isFinite(band))) return null;

  return {
    boardScrews: { quantity: screws }, metalScrews: { status: 'to-define' },
    jointTape: { meters: tape }, jointCompound: { kilograms: compound },
    acousticBand: band === null ? null : { meters: band, method: 'area-coefficient' },
  };
}
