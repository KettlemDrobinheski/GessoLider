export type WallPricingInput = {
  laborRate: number;
  materialsTotal: number;
  notes: string;
};

export type WallPricing = WallPricingInput & {
  billingArea: number;
  laborTotal: number;
  total: number;
};
