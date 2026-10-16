import type { Href } from 'expo-router';
import type { SavedBudget, NewSavedBudget, SavedBudgetUpdate } from '../types/saved-budget';
import type { CompanyProfile } from '../types/company-profile';
import type { ClientData } from '../types/client';
import type { BudgetPricingInput } from '../types/budget-pricing';
import type { WallBudgetInput } from '../types/wall-configuration';
import type { CeilingBudgetInput } from '../types/ceiling';
import type { WoodWallCladdingBudgetInput } from '../types/wood-wall-cladding';
import { calculateWallPricing } from '../domain/calculations/wallPricing';
import { calculateCeilingPricing } from '../domain/calculations/ceilingPricing';
import { calculateWoodWallCladdingPricing } from '../domain/calculations/woodWallCladding';
import { formatBRL } from './currency';

export const savedBudgetServiceLabels = {
  wall: 'Parede de drywall',
  ceiling: 'Forro de drywall',
  lining: 'Revestimento em parede de madeira',
} as const;

export const savedBudgetStatusLabels = {
  draft: 'Rascunho',
  sent: 'Enviado',
  approved: 'Aprovado',
  rejected: 'Recusado',
  completed: 'Concluído',
} as const;

export function savedBudgetTotal(record: SavedBudget): number | null {
  if (record.service === 'wall') return calculateWallPricing(record.budget.measurements, record.pricing)?.total ?? null;
  if (record.service === 'ceiling') return calculateCeilingPricing(record.budget.measurements, record.pricing)?.total ?? null;
  return calculateWoodWallCladdingPricing(record.budget.measurements, record.pricing)?.total ?? null;
}

export function savedBudgetAmountLabel(record: SavedBudget): string {
  const total = savedBudgetTotal(record);
  return total === null ? 'Valor indisponível' : formatBRL(total);
}

export function formatBudgetHistoryDate(value: string): string {
  return new Date(value).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
}

export type BudgetHistoryState = 'loading' | 'error' | 'empty' | 'ready';

export function budgetHistoryState(budgets: SavedBudget[], loading: boolean, error: string | null): BudgetHistoryState {
  if (loading) return 'loading';
  if (error) return 'error';
  return budgets.length ? 'ready' : 'empty';
}

export function savedBudgetDetailsRoute(id: string): Href {
  return { pathname: '/orcamentos/[id]' as const, params: { id } } as unknown as Href;
}

export function savedBudgetEditRoute(budget: SavedBudget): Href {
  return {
    pathname: '/orcamento/medidas',
    params: {
      servico: budget.service,
      cliente: JSON.stringify(budget.client),
      orcamento: JSON.stringify(budget.budget),
      valores: JSON.stringify(budget.pricing),
      orcamentoSalvoId: budget.id,
    },
  };
}

export function buildSavedBudgetInput(service: 'wall', budget: WallBudgetInput, pricing: BudgetPricingInput, company: CompanyProfile, client: ClientData | null): NewSavedBudget | null;
export function buildSavedBudgetInput(service: 'ceiling', budget: CeilingBudgetInput, pricing: BudgetPricingInput, company: CompanyProfile, client: ClientData | null): NewSavedBudget | null;
export function buildSavedBudgetInput(service: 'lining', budget: WoodWallCladdingBudgetInput, pricing: BudgetPricingInput, company: CompanyProfile, client: ClientData | null): NewSavedBudget | null;
export function buildSavedBudgetInput(service: SavedBudget['service'], budget: SavedBudget['budget'], pricing: BudgetPricingInput, company: CompanyProfile, client: ClientData | null): NewSavedBudget | null {
  if (!client) return null;
  const common = { company: { ...company }, client: { ...client }, pricing: { ...pricing } };
  if (service === 'wall' && budget.measurements.service === 'wall') return { ...common, service, budget } as Extract<NewSavedBudget, { service: 'wall' }>;
  if (service === 'ceiling' && budget.measurements.service === 'ceiling') return { ...common, service, budget } as Extract<NewSavedBudget, { service: 'ceiling' }>;
  if (service === 'lining' && budget.measurements.service === 'lining') return { ...common, service, budget } as Extract<NewSavedBudget, { service: 'lining' }>;
  return null;
}

export type SavedBudgetWriter = {
  create: (input: NewSavedBudget) => Promise<SavedBudget>;
  update: (id: string, changes: SavedBudgetUpdate) => Promise<SavedBudget>;
};

export function saveBudgetRecord(writer: SavedBudgetWriter, input: NewSavedBudget, savedId?: string): Promise<SavedBudget> {
  if (savedId) return writer.update(savedId, { client: input.client, pricing: input.pricing, budget: input.budget });
  return writer.create(input);
}
