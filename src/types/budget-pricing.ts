export type BudgetPricingInput = { laborRate: number; materialsTotal: number; notes: string };
export type BudgetPricing = BudgetPricingInput & { billingArea: number; laborTotal: number; total: number };
