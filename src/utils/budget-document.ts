import type { BudgetDocumentData, BudgetDocumentSource, DocumentRow } from '../types/budget-document';
import type { CompanyProfile } from '../types/company-profile';
import type { ClientData } from '../types/client';
import { formatArea } from './measurements';
import { toCents } from './currency';
import { validateClient } from './client';
import { validateCompanyProfile } from './company-profile';
import { insulationOptions } from '../constants/wall-configuration';

const decimal = (value: number) => value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const meters = (value: number) => `${decimal(value)} m`;
const quantity = (value: number, unit: string) => `${value.toLocaleString('pt-BR')} ${unit}`;
const row = (label: string, value: string): DocumentRow => ({ label, value });

export function formatIssueDate(issueDate: string): string {
  return new Date(issueDate).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
}

export function assertBudgetDocumentData(data: BudgetDocumentData): void {
  if (!data.company.companyName.trim()) throw new Error('Informe o nome comercial nas configurações da empresa.');
  if (!data.client.name.trim()) throw new Error('Informe o nome do cliente antes de gerar o orçamento.');
  if (!['wall', 'ceiling', 'lining'].includes(data.service) || !data.serviceName.trim()) throw new Error('Selecione um serviço válido.');
  if (!data.measurements.length || !data.configuration.length || !data.materials.length
    || [...data.measurements, ...data.configuration, ...data.materials].some((item) => !item.label.trim() || !item.value.trim())) {
    throw new Error('Complete as medidas, a configuração e os materiais.');
  }
  const { pricing } = data;
  const materialCents = toCents(pricing.materialsTotal);
  const laborCents = toCents(pricing.laborTotal);
  const totalCents = toCents(pricing.total);
  if (!Number.isFinite(pricing.billingArea) || pricing.billingArea <= 0 || pricing.laborRate <= 0 || toCents(pricing.laborRate) === null
    || materialCents === null || laborCents === null || totalCents === null || materialCents + laborCents !== totalCents) {
    throw new Error('Revise os valores do orçamento.');
  }
  if (!Number.isFinite(Date.parse(data.issueDate))) throw new Error('A data de emissão é inválida.');
}

export function buildBudgetDocumentData({ company, client, source, issueDate }: {
  company: CompanyProfile; client: ClientData | null; source: BudgetDocumentSource; issueDate: string;
}): BudgetDocumentData {
  const validCompany = validateCompanyProfile(company).value;
  if (!validCompany) throw new Error('Revise os dados da empresa nas configurações.');
  const validClient = client && validateClient(client).value;
  if (!validClient) throw new Error('Informe os dados do cliente antes de gerar o orçamento.');
  const dimensions = source.budget.measurements;
  const size = dimensions.service === 'wall' ? [dimensions.length, dimensions.height]
    : dimensions.service === 'ceiling' ? [dimensions.length, dimensions.width] : [dimensions.width, dimensions.height];
  if (source.service !== dimensions.service || size.some((value) => !Number.isFinite(value) || value <= 0)) throw new Error('Revise as medidas do serviço.');
  const materials: DocumentRow[] = [];
  const measurements: DocumentRow[] = [];
  const configuration: DocumentRow[] = [];
  let serviceName: string;
  if (source.service === 'wall') {
    serviceName = 'Parede de drywall';
    const { measurements: sizes, configuration: config } = source.budget;
    const result = source.materials;
    measurements.push(row('Comprimento', meters(sizes.length)), row('Altura', meters(sizes.height)), row('Área', formatArea(result.wallArea)));
    configuration.push(row('Tipo de placa', config.boardType), row('Perfil', `${config.profileWidth} mm`),
      row('Espaçamento', `${config.studSpacingCm} cm`), row('Aplicação', `${config.sides} ${config.sides === 1 ? 'lado' : 'lados'}`),
      row('Perda', `${config.wastePercent}%`), row('Isolamento', insulationOptions.find((option) => option.value === config.insulation)?.label ?? 'Não'),
      row('Banda acústica', config.acousticBand ? 'Sim' : 'Não'));
    materials.push(row(`Placa ${result.boards.type} ${decimal(result.boards.dimensions.width)} × ${decimal(result.boards.dimensions.height)} m`, quantity(result.boards.quantity, 'placas')),
      row(`Guia ${result.guides.width} mm - ${result.guides.pieceLength} m`, quantity(result.guides.quantity, 'peças')),
      row(`Montante ${result.studs.width} mm - ${result.studs.pieceLength} m`, quantity(result.studs.quantity, 'peças')),
      row('Parafusos para placas', quantity(result.consumables.boardScrews.quantity, 'unidades estimadas')),
      row('Parafusos metal-metal', 'Quantidade a definir'), row('Fita para juntas', meters(result.consumables.jointTape.meters)),
      row('Massa para juntas', `${decimal(result.consumables.jointCompound.kilograms)} kg`));
    if (result.insulation) materials.push(row(insulationOptions.find((option) => option.value === result.insulation?.type)?.label ?? 'Isolamento', formatArea(result.insulation.areaWithWaste)));
    if (result.consumables.acousticBand) materials.push(row('Banda acústica', meters(result.consumables.acousticBand.meters)));
  } else {
    const result = source.materials;
    if (source.service === 'ceiling') {
      serviceName = 'Forro de drywall';
      measurements.push(row('Comprimento', meters(source.budget.measurements.length)), row('Largura', meters(source.budget.measurements.width)));
      configuration.push(row('Espaçamento', `${source.budget.configuration.spacingCm} cm`));
      configuration.push(row('Premissa de F530 e cantoneiras', 'Contagem base por trecho independente, sem reaproveitar sobras. Não inclui material adicional para emendas ou sobreposições; os quantitativos podem aumentar. Confirme com o sistema técnico antes da compra.'));
      materials.push(row('Perfil F530 - 3 m', quantity(source.materials.profiles, 'barras')), row('Cantoneira - 3 m', quantity(source.materials.angles, 'peças')));
    } else {
      serviceName = 'Revestimento em parede de madeira';
      measurements.push(row('Largura', meters(source.budget.measurements.width)), row('Altura', meters(source.budget.measurements.height)));
    }
    measurements.push(row('Área', formatArea(result.area)));
    configuration.push(row('Perda', `${source.budget.configuration.wastePercent}%`));
    materials.unshift(row('Placa ST 1,20 × 1,80 m', quantity(result.boards, 'placas')));
    materials.push(row(source.service === 'ceiling' ? 'Parafusos G25' : 'Parafusos', quantity(result.screws, 'unidades estimadas')),
      row('Caixa com 1.000 parafusos', quantity(result.screwBoxes, result.screwBoxes === 1 ? 'caixa' : 'caixas')),
      row('Fita para juntas', meters(result.tapeMeters)), row('Massa para juntas', `${decimal(result.compoundKg)} kg`));
  }
  const data: BudgetDocumentData = {
    company: { ...validCompany }, client: { ...validClient }, service: source.service, serviceName,
    measurements, configuration, materials, pricing: { ...source.pricing }, issueDate, notes: source.pricing.notes.trim(),
  };
  assertBudgetDocumentData(data);
  return data;
}

export function budgetPdfFilename(data: Pick<BudgetDocumentData, 'company' | 'client'>): string {
  const sanitize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60).replace(/-+$/g, '');
  return ['Orcamento', sanitize(data.company.companyName) || 'GessoLider', sanitize(data.client.name)].filter(Boolean).join('-') + '.pdf';
}
