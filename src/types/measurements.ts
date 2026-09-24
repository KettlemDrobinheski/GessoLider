export type DimensionKey = 'length' | 'height' | 'width' | 'depth';
export type MeasurementDraft = Record<DimensionKey, string>;
export type OpeningType = 'door' | 'window';

export type OpeningDraft = {
  id: string;
  type: OpeningType;
  width: string;
  height: string;
  quantity: string;
};

export type Opening = {
  id: string;
  type: OpeningType;
  width: number;
  height: number;
  quantity: number;
};

export type ServiceMeasurements =
  | { service: 'wall'; length: number; height: number; openings: Opening[] }
  | { service: 'ceiling'; length: number; width: number }
  | { service: 'lining'; length: number; height: number }
  | { service: 'details'; length: number; height: number; depth: number };

export type OpeningErrors = Partial<Record<'width' | 'height' | 'quantity', string>>;
export type AreaSummary = { gross: number | null; openings: number | null; net: number | null };
