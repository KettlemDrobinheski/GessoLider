import type { CompanyProfile } from './company-profile';
import type { ClientData } from './client';
import type { BudgetPricing } from './budget-pricing';
import type { WallBudgetInput } from './wall-configuration';
import type { CeilingBudgetInput } from './ceiling';
import type { WoodWallCladdingBudgetInput } from './wood-wall-cladding';
import type { WallMaterialsValidResult } from '../domain/calculations/wallMaterials';
import type { CeilingValidResult } from '../domain/calculations/ceiling';
import type { WoodWallCladdingValidResult } from '../domain/calculations/woodWallCladding';

export type BudgetDocumentSource = (
  | { service: 'wall'; budget: WallBudgetInput; materials: WallMaterialsValidResult }
  | { service: 'ceiling'; budget: CeilingBudgetInput; materials: CeilingValidResult }
  | { service: 'lining'; budget: WoodWallCladdingBudgetInput; materials: WoodWallCladdingValidResult }
) & { pricing: BudgetPricing };
export type DocumentRow = { label: string; value: string };
export type BudgetDocumentData = {
  company: CompanyProfile; client: ClientData; service: BudgetDocumentSource['service']; serviceName: string;
  measurements: DocumentRow[]; configuration: DocumentRow[]; materials: DocumentRow[];
  pricing: BudgetPricing; issueDate: string; notes: string;
};
