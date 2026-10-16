import type { CompanyProfile } from './company-profile';
import type { ClientData } from './client';
import type { BudgetPricingInput } from './budget-pricing';
import type { WallBudgetInput } from './wall-configuration';
import type { CeilingBudgetInput } from './ceiling';
import type { WoodWallCladdingBudgetInput } from './wood-wall-cladding';

export const savedBudgetSchemaVersion = 1 as const;
export type BudgetStatus = 'draft' | 'sent' | 'approved' | 'rejected' | 'completed';

type SavedBudgetBase = {
  schemaVersion: typeof savedBudgetSchemaVersion;
  id: string;
  createdAt: string;
  updatedAt: string;
  status: BudgetStatus;
  company: CompanyProfile;
  client: ClientData;
  pricing: BudgetPricingInput;
};

export type SavedBudget = SavedBudgetBase & (
  | { service: 'wall'; budget: WallBudgetInput }
  | { service: 'ceiling'; budget: CeilingBudgetInput }
  | { service: 'lining'; budget: WoodWallCladdingBudgetInput }
);

export type NewSavedBudget = SavedBudget extends infer T
  ? T extends SavedBudget ? Omit<T, 'schemaVersion' | 'id' | 'createdAt' | 'updatedAt' | 'status'> & { status?: BudgetStatus } : never
  : never;

export type SavedBudgetUpdate = Partial<Pick<SavedBudget, 'status' | 'company' | 'client' | 'pricing' | 'budget'>>;
