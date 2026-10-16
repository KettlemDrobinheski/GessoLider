import type { CompanyProfile } from '../types/company-profile';
import type { ClientData } from '../types/client';
import type { BudgetPricingInput } from '../types/budget-pricing';
import type { SavedBudget, NewSavedBudget, BudgetStatus } from '../types/saved-budget';
import { calculateWallPricing } from '../domain/calculations/wallPricing';
import { calculateCeilingPricing } from '../domain/calculations/ceilingPricing';
import { calculateWoodWallCladdingPricing } from '../domain/calculations/woodWallCladding';
import { validateClient } from './client';
import { validateCompanyProfile } from './company-profile';
import { parseWallBudgetInput } from './wall-configuration';
import { parseCeilingBudgetInput } from './ceiling';
import { parseWoodWallCladdingBudgetInput } from './wood-wall-cladding';
import { parseWallPricingInput } from './wall-pricing';
import { savedBudgetSchemaVersion } from '../types/saved-budget';
import { emptyClient } from './client';
import { defaultCompanyProfile } from './company-profile';

const statuses: BudgetStatus[] = ['draft', 'sent', 'approved', 'rejected', 'completed'];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseClient(value: unknown): ClientData | null {
  if (!isRecord(value) || Object.keys(emptyClient).some((key) => typeof value[key] !== 'string')) return null;
  const parsed = validateClient(value as unknown as ClientData).value;
  return parsed?.name ? parsed : null;
}

function parseCompany(value: unknown): CompanyProfile | null {
  if (!isRecord(value) || Object.keys(defaultCompanyProfile).some((key) => key === 'logoUri'
    ? value[key] !== null && typeof value[key] !== 'string' : typeof value[key] !== 'string')) return null;
  return validateCompanyProfile(value as unknown as CompanyProfile).value;
}

function parsePricing(value: unknown): BudgetPricingInput | null {
  if (!isRecord(value)) return null;
  return parseWallPricingInput(JSON.stringify(value));
}

function isIsoDate(value: unknown): value is string {
  return typeof value === 'string' && Number.isFinite(Date.parse(value)) && new Date(value).toISOString() === value;
}

export function validateSavedBudget(value: unknown): SavedBudget | null {
  if (!isRecord(value) || value.schemaVersion !== savedBudgetSchemaVersion
    || typeof value.id !== 'string' || !value.id.trim() || !isIsoDate(value.createdAt) || !isIsoDate(value.updatedAt)
    || Date.parse(value.updatedAt as string) < Date.parse(value.createdAt as string)
    || !statuses.includes(value.status as BudgetStatus)) return null;

  const company = parseCompany(value.company);
  const client = parseClient(value.client);
  const pricing = parsePricing(value.pricing);
  if (!company || !client || !pricing || !isRecord(value.budget)) return null;

  if (value.service === 'wall') {
    const budget = parseWallBudgetInput(JSON.stringify(value.budget));
    if (!budget || !calculateWallPricing(budget.measurements, pricing)) return null;
    return { schemaVersion: savedBudgetSchemaVersion, id: value.id, createdAt: value.createdAt as string, updatedAt: value.updatedAt as string,
      status: value.status as BudgetStatus, service: 'wall', budget, company, client, pricing };
  }
  if (value.service === 'ceiling') {
    const budget = parseCeilingBudgetInput(JSON.stringify(value.budget));
    if (!budget || !calculateCeilingPricing(budget.measurements, pricing)) return null;
    return { schemaVersion: savedBudgetSchemaVersion, id: value.id, createdAt: value.createdAt as string, updatedAt: value.updatedAt as string,
      status: value.status as BudgetStatus, service: 'ceiling', budget, company, client, pricing };
  }
  if (value.service === 'lining') {
    const budget = parseWoodWallCladdingBudgetInput(JSON.stringify(value.budget));
    if (!budget || !calculateWoodWallCladdingPricing(budget.measurements, pricing)) return null;
    return { schemaVersion: savedBudgetSchemaVersion, id: value.id, createdAt: value.createdAt as string, updatedAt: value.updatedAt as string,
      status: value.status as BudgetStatus, service: 'lining', budget, company, client, pricing };
  }
  return null;
}

export function createSavedBudget(input: NewSavedBudget, metadata: { id: string; now: string }): SavedBudget {
  const record = validateSavedBudget({ ...input, schemaVersion: savedBudgetSchemaVersion, id: metadata.id,
    createdAt: metadata.now, updatedAt: metadata.now, status: input.status ?? 'draft' });
  if (!record) throw new Error('Os dados do orçamento são inválidos. Revise cliente, serviço e valores antes de salvar.');
  return record;
}

export function duplicateSavedBudget(source: SavedBudget, metadata: { id: string; now: string }): SavedBudget {
  return createSavedBudget({ ...source, status: 'draft' }, metadata);
}
