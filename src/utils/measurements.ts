import type { ServiceType } from '../constants/services';
import type {
  AreaSummary, DimensionKey, MeasurementDraft, Opening, OpeningDraft,
  OpeningErrors, ServiceMeasurements,
} from '../types/measurements';

export const dimensionFields: Record<ServiceType, readonly DimensionKey[]> = {
  wall: ['length', 'height'],
  ceiling: ['length', 'width'],
  lining: ['length', 'height'],
  details: ['length', 'height', 'depth'],
};

export const dimensionLabels: Record<DimensionKey, string> = {
  length: 'Comprimento', height: 'Altura', width: 'Largura', depth: 'Profundidade',
};

export function parsePositiveDecimal(value: string): number | null {
  const normalized = value.trim();
  if (!/^(?:\d+(?:[.,]\d+)?|[.,]\d+)$/.test(normalized)) return null;
  const number = Number(normalized.replace(',', '.'));
  return Number.isFinite(number) && number > 0 ? number : null;
}

export function parseQuantity(value: string): number | null {
  if (!/^\d+$/.test(value.trim())) return null;
  const number = Number(value);
  return Number.isSafeInteger(number) && number >= 1 ? number : null;
}

export type MeasurementValidation = {
  fields: Partial<Record<DimensionKey, string>>;
  openings: Record<string, OpeningErrors>;
  openingsMessage?: string;
  areaMessage?: string;
  areas: AreaSummary | null;
  value: ServiceMeasurements | null;
};

export function validateMeasurements(
  service: ServiceType, draft: MeasurementDraft, hasOpenings: boolean, openingDrafts: readonly OpeningDraft[],
): MeasurementValidation {
  const fields: MeasurementValidation['fields'] = {};
  const dimensions = { length: 0, height: 0, width: 0, depth: 0 };
  for (const key of dimensionFields[service]) {
    const parsed = parsePositiveDecimal(draft[key]);
    if (parsed === null) fields[key] = 'Informe uma medida maior que zero.';
    else dimensions[key] = parsed;
  }

  const openings: MeasurementValidation['openings'] = {};
  const values: Opening[] = [];
  const includeOpenings = service === 'wall' && hasOpenings;
  let openingsMessage: string | undefined;
  if (includeOpenings) {
    if (openingDrafts.length === 0) openingsMessage = 'Adicione uma abertura ou selecione Não.';
    for (const opening of openingDrafts) {
      const width = parsePositiveDecimal(opening.width);
      const height = parsePositiveDecimal(opening.height);
      const quantity = parseQuantity(opening.quantity);
      const errors: OpeningErrors = {};
      if (width === null) errors.width = 'Informe uma largura maior que zero.';
      if (height === null) errors.height = 'Informe uma altura maior que zero.';
      if (quantity === null) errors.quantity = 'Informe uma quantidade inteira de pelo menos 1.';
      if (Object.keys(errors).length) openings[opening.id] = errors;
      if (width !== null && height !== null && quantity !== null) {
        values.push({ id: opening.id, type: opening.type, width, height, quantity });
      }
    }
  }

  const dimensionsValid = Object.keys(fields).length === 0;
  const openingsValid = Object.keys(openings).length === 0 && !openingsMessage;
  let areas: AreaSummary | null = null;
  let areaMessage: string | undefined;
  if (service !== 'details') {
    const rawGross = dimensionsValid ? dimensions.length * (service === 'ceiling' ? dimensions.width : dimensions.height) : null;
    const rawOpenings = openingsValid ? values.reduce((sum, opening) => sum + opening.width * opening.height * opening.quantity, 0) : null;
    const gross = rawGross !== null && Number.isFinite(rawGross) && rawGross > 0 ? rawGross : null;
    const openingArea = rawOpenings !== null && Number.isFinite(rawOpenings) ? rawOpenings : null;
    if ((dimensionsValid && gross === null) || (openingsValid && openingArea === null)) {
      areaMessage = 'Revise as medidas: os valores estão fora do intervalo permitido.';
    }
    let net: number | null = null;
    if (gross !== null && openingArea !== null) {
      const difference = gross - openingArea;
      const tolerance = Number.EPSILON * Math.max(gross, openingArea, 1) * 8;
      if (difference < -tolerance) areaMessage = 'As aberturas ultrapassam a área da parede. Revise as medidas.';
      net = Math.max(0, difference);
    }
    areas = { gross, openings: openingArea, net };
  }

  let value: ServiceMeasurements | null = null;
  if (dimensionsValid && openingsValid && !areaMessage) {
    const { length, height, width, depth } = dimensions;
    switch (service) {
      case 'wall': value = { service, length, height, openings: values }; break;
      case 'ceiling': value = { service, length, width }; break;
      case 'lining': value = { service, length, height }; break;
      case 'details': value = { service, length, height, depth }; break;
    }
  }
  return { fields, openings, openingsMessage, areaMessage, areas, value };
}

export function formatArea(value: number | null): string {
  return value === null ? '—' : `${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} m²`;
}
