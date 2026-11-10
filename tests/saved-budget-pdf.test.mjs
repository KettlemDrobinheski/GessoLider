import assert from 'node:assert/strict';
import test from 'node:test';
import './register-typescript.mjs';
import { documentFixtures } from './budget-document-fixtures.mjs';

const { buildSavedBudgetDocumentData } = await import('../src/utils/budget-document.ts');
const { buildBudgetPdfHtml } = await import('../src/services/budget-pdf-template.ts');
const { buildSavedBudgetInput } = await import('../src/utils/budget-history.ts');
const { createSavedBudget } = await import('../src/utils/saved-budget.ts');
const { savedBudgetPdfActionLabels, performBudgetPdfOperation } = await import('../src/utils/budget-pdf-action.ts');
const { calculateWallMaterials } = await import('../src/domain/calculations/wallMaterials.ts');

function records() {
  const fixture = documentFixtures();
  const company = { ...fixture.company, companyName: 'Empresa histórica', city: 'Curitiba' };
  return fixture.sources.map((source, index) => createSavedBudget(
    buildSavedBudgetInput(source.service, source.budget, source.pricing, company, fixture.client),
    { id: `saved-${index}`, now: fixture.issueDate },
  ));
}

test('rebuilds documents for all saved services from historical company and client snapshots', () => {
  const docs = records().map((record) => buildSavedBudgetDocumentData(record));
  assert.deepEqual(docs.map((doc) => doc.service), ['wall', 'ceiling', 'lining']);
  for (const doc of docs) {
    assert.equal(doc.company.companyName, 'Empresa histórica');
    assert.equal(doc.company.city, 'Curitiba');
    assert.equal(doc.client.name, 'Jo\u00e3o da Silva');
    assert.equal(doc.pricing.materialsTotal + doc.pricing.laborTotal, doc.pricing.total);
    assert.match(doc.pricing.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), /^R\$/);
    const html = buildBudgetPdfHtml(doc);
    assert.equal(html.split('Valor dos materiais').length - 1, 1);
    assert.equal(html.split('Mão de obra').length - 1, 1);
    assert.equal(html.split('TOTAL').length - 1, 1);
  }
});

test('wall PDF includes each door and window quantity and dimensions once', () => {
  const fixture = documentFixtures();
  const source = fixture.sources[0];
  source.budget.measurements.openings = [
    { id: 'door-1', type: 'door', width: 0.9, height: 2.1, quantity: 1 },
    { id: 'window-1', type: 'window', width: 1.2, height: 1, quantity: 2 },
  ];
  source.budget.measurements.areas = { gross: 10.8, openings: 4.29, net: 6.51 };
  source.materials = calculateWallMaterials({ ...source.budget.measurements, ...source.budget.configuration });
  const input = buildSavedBudgetInput('wall', source.budget, source.pricing, fixture.company, fixture.client);
  const doc = buildSavedBudgetDocumentData(createSavedBudget(input, { id: 'wall-openings', now: fixture.issueDate }));
  assert.deepEqual(doc.measurements.filter((row) => /^(Porta|Janela)/.test(row.label)), [
    { label: 'Porta (1)', value: '0,90 m × 2,10 m' },
    { label: 'Janela (2)', value: '1,20 m × 1,00 m' },
  ]);
});

test('detail screen PDF actions expose preview, generation and sharing', () => {
  assert.deepEqual(savedBudgetPdfActionLabels, ['Visualizar orçamento', 'Gerar PDF', 'Compartilhar PDF']);
});

test('reports PDF generation and sharing failures to the caller', async () => {
  await assert.rejects(performBudgetPdfOperation(false, { generate: async () => { throw new Error('print failed'); }, share: async () => {} }), /print failed/);
  await assert.rejects(performBudgetPdfOperation(true, { generate: async () => 'pdf', share: async () => { throw new Error('share failed'); } }), /share failed/);
});

test('does not share when generation fails and shares the freshly generated historical PDF', async () => {
  const events = [];
  const result = await performBudgetPdfOperation(true, {
    generate: async () => { events.push('generate'); return { uri: 'fresh-history.pdf' }; },
    share: async (pdf) => { events.push(`share:${pdf.uri}`); },
  });
  assert.equal(result.uri, 'fresh-history.pdf');
  assert.deepEqual(events, ['generate', 'share:fresh-history.pdf']);
});
