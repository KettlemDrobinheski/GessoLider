import './register-typescript.mjs';
const { calculateWallMaterials } = await import('../src/domain/calculations/wallMaterials.ts');
const { calculateWallPricing } = await import('../src/domain/calculations/wallPricing.ts');
const { calculateCeiling } = await import('../src/domain/calculations/ceiling.ts');
const { calculateCeilingPricing } = await import('../src/domain/calculations/ceilingPricing.ts');
const { calculateWoodWallCladding, calculateWoodWallCladdingPricing } = await import('../src/domain/calculations/woodWallCladding.ts');
const { defaultCompanyProfile } = await import('../src/utils/company-profile.ts');
const { emptyClient } = await import('../src/utils/client.ts');

export function documentFixtures() {
  const company = { ...defaultCompanyProfile };
  const client = { ...emptyClient, name: 'João da Silva', street: 'Rua das Flores', number: '123', city: 'Lapa', state: 'PR' };
  const values = { laborRate: 60, materialsTotal: 1000, notes: '' };
  const wall = {
    measurements: { service: 'wall', length: 4, height: 2.7, openings: [], areas: { gross: 10.8, openings: 0, net: 10.8 } },
    configuration: { boardType: 'ST', boardDimensions: { width: 1.2, height: 1.8 }, profileWidth: 70, studSpacingCm: 60,
      guideLength: 3, studLength: 3, sides: 2, wastePercent: 5, insulation: 'glass-wool', acousticBand: true },
  };
  const ceiling = { measurements: { service: 'ceiling', length: 5, width: 4 }, configuration: { spacingCm: 40, wastePercent: 5 } };
  const lining = { measurements: { service: 'lining', width: 4, height: 2.7 }, configuration: { wastePercent: 5 } };
  return {
    company, client, issueDate: '2026-10-15T12:00:00.000Z',
    sources: [
      { service: 'wall', budget: wall, materials: calculateWallMaterials({ ...wall.measurements, ...wall.configuration }), pricing: calculateWallPricing(wall.measurements, values) },
      { service: 'ceiling', budget: ceiling, materials: calculateCeiling({ ...ceiling.measurements, ...ceiling.configuration }), pricing: calculateCeilingPricing(ceiling.measurements, values) },
      { service: 'lining', budget: lining, materials: calculateWoodWallCladding({ ...lining.measurements, ...lining.configuration }), pricing: calculateWoodWallCladdingPricing(lining.measurements, values) },
    ],
  };
}
