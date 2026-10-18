import assert from 'node:assert/strict';
import test from 'node:test';
import './register-typescript.mjs';
import { documentFixtures } from './budget-document-fixtures.mjs';
const { buildBudgetDocumentData, assertBudgetDocumentData, budgetPdfFilename, formatIssueDate } = await import('../src/utils/budget-document.ts');
const { buildBudgetPdfHtml, escapeHtml } = await import('../src/services/budget-pdf-template.ts');
const { formatClientAddress } = await import('../src/utils/client.ts');
const { formatBRL } = await import('../src/utils/currency.ts');

function document(index = 0, overrides = {}) {
  const fixtures = documentFixtures();
  return buildBudgetDocumentData({ ...fixtures, source: fixtures.sources[index], ...overrides });
}
test('builds a common document with structured company, client, pricing and issue date', () => {
  const data = document();
  assert.equal(data.company.companyName, 'GessoLider');
  assert.equal(data.client.name, 'João da Silva');
  assert.equal(data.serviceName, 'Parede de drywall');
  assert.equal(data.issueDate, '2026-10-15T12:00:00.000Z');
  assert.equal(data.pricing.total, 1648);
});
test('wall document includes its calculated structure, insulation and acoustic band', () => {
  const data = document();
  const labels = data.materials.map((item) => item.label).join(' ');
  for (const expected of ['Placa ST', 'Guia 70 mm', 'Montante 70 mm', 'Parafusos para placas', 'Parafusos metal-metal', 'Fita', 'Massa', 'Lã de vidro', 'Banda acústica']) assert.ok(labels.includes(expected), expected);
  assert.equal(data.materials[0].value, '11 placas');
  assert.ok(!labels.includes('F530'));
});
test('ceiling document includes F530 and angles and no wall-only materials', () => {
  const data = document(1);
  const labels = data.materials.map((item) => item.label).join(' ');
  for (const expected of ['Placa ST', 'F530', 'Cantoneira', 'G25', 'Caixa com 1.000', 'Fita', 'Massa']) assert.ok(labels.includes(expected));
  for (const excluded of ['Guia', 'Montante', 'Lã', 'Banda']) assert.ok(!labels.includes(excluded));
  assert.equal(data.materials.find((item) => item.label.includes('F530')).value, '24 barras');
  assert.equal(data.materials.find((item) => item.label.includes('Cantoneira')).value, '9 peças');
  assert.match(data.configuration.find((item) => item.label.includes('Premissa')).value, /Contagem base por trecho independente/);
  assert.match(data.configuration.find((item) => item.label.includes('Premissa')).value, /quantitativos podem aumentar/);
});
test('wood cladding document has only boards, screws, boxes, tape and compound', () => {
  const data = document(2);
  assert.deepEqual(data.materials.map((item) => item.label), ['Placa ST 1,20 × 1,80 m', 'Parafusos', 'Caixa com 1.000 parafusos', 'Fita para juntas', 'Massa para juntas']);
  assert.equal(data.materials[1].value, '171 unidades estimadas');
});
test('adapters use supplied material results without recalculating them', () => {
  const fixture = documentFixtures();
  const source = fixture.sources[1];
  source.materials.boards = 99;
  source.materials.profiles = 88;
  const data = buildBudgetDocumentData({ ...fixture, source });
  assert.equal(data.materials[0].value, '99 placas');
  assert.equal(data.materials.find((item) => item.label.includes('F530')).value, '88 barras');
});
test('each service exposes only its own dimensions and configuration', () => {
  assert.deepEqual(document().measurements.map((item) => item.label), ['Comprimento', 'Altura', 'Área']);
  assert.deepEqual(document(1).measurements.map((item) => item.label), ['Comprimento', 'Largura', 'Área']);
  assert.deepEqual(document(2).measurements.map((item) => item.label), ['Largura', 'Altura', 'Área']);
  assert.deepEqual(document(2).configuration.map((item) => item.label), ['Perda']);
  assert.deepEqual(document(1).configuration.map((item) => item.label), ['Espaçamento', 'Premissa de F530 e cantoneiras', 'Perda']);
});
test('HTML omits optional blank contact, commercial note and observations', () => {
  const html = buildBudgetPdfHtml(document());
  for (const excluded of ['WhatsApp:', 'Complemento:', 'Observações:', 'Observação comercial', 'Observações do orçamento', '<img']) assert.ok(!html.includes(excluded), excluded);
  assert.ok(!/<p>\s*<\/p>/.test(html));
});
test('sanitizes names into a bounded PDF filename', () => {
  const data = document();
  assert.equal(budgetPdfFilename(data), 'Orcamento-GessoLider-Joao-da-Silva.pdf');
  assert.equal(budgetPdfFilename({ company: { companyName: '' }, client: { name: '' } }), 'Orcamento-GessoLider.pdf');
  assert.equal(budgetPdfFilename({ company: { companyName: ' Gesso/Lider ' }, client: { name: '../../João:*?"<>&|' } }), 'Orcamento-Gesso-Lider-Joao.pdf');
  assert.ok(budgetPdfFilename({ company: { companyName: 'A'.repeat(500) }, client: { name: 'B'.repeat(500) } }).length < 150);
});
test('uses Brazilian currency from the existing utility', () => {
  const data = document();
  const html = buildBudgetPdfHtml(data);
  assert.ok(html.includes(formatBRL(data.pricing.total)));
  assert.equal(formatBRL(1250).replace(/\s/g, ' '), 'R$ 1.250,00');
});
test('reuses existing address formatting', () => {
  const data = document();
  for (const line of formatClientAddress(data.client)) assert.ok(buildBudgetPdfHtml(data).includes(escapeHtml(line)));
});
test('each service renders the same template containing company, client, service and total', () => {
  for (let i = 0; i < 3; i++) {
    const data = document(i);
    const html = buildBudgetPdfHtml(data);
    for (const value of [data.company.companyName, data.client.name, data.serviceName, formatBRL(data.pricing.total), 'ORÇAMENTO', 'Materiais estimados']) assert.ok(html.includes(escapeHtml(value)), value);
    assert.match(html, /size: A4 portrait/);
    assert.match(html, /table-header-group/);
  }
});
test('commercial observation appears exactly once at the document end', () => {
  const data = document(); data.company.commercialNote = 'Sujeito à vistoria técnica.';
  const html = buildBudgetPdfHtml(data);
  assert.equal(html.split('Sujeito à vistoria técnica.').length, 2);
  assert.ok(html.indexOf('Observação comercial') > html.indexOf('TOTAL'));
});
test('escapes user data in names, addresses, notes and material text', () => {
  const data = document();
  const input = '<script>alert("x")</script> & \'teste\'';
  data.company.companyName = input; data.client.name = input; data.client.street = input;
  data.client.notes = input; data.notes = input; data.company.commercialNote = input; data.materials[0].label = input;
  const html = buildBudgetPdfHtml(data);
  assert.ok(!html.includes('<script>'));
  assert.ok(html.includes('&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt; &amp; &#39;teste&#39;'));
  assert.ok(html.includes("default-src 'none'"));
});
test('does not include remote or executable logo references in PDF HTML', () => {
  const data = document();
  for (const uri of ['https://example.com/logo.png', 'file:///logo.png', 'javascript:alert(1)', 'data:image/svg+xml;base64,PHN2Zz4=']) assert.ok(!buildBudgetPdfHtml(data, uri).includes('<img'));
  assert.ok(buildBudgetPdfHtml(data, 'data:image/png;base64,aGVsbG8=').includes('<img'));
});
test('blocks missing names, invalid dimensions, values, service and date', () => {
  const fixture = documentFixtures();
  const input = { ...fixture, source: fixture.sources[0] };
  assert.throws(() => buildBudgetDocumentData({ ...input, client: null }), /cliente/);
  assert.throws(() => buildBudgetDocumentData({ ...input, company: { ...fixture.company, companyName: '' } }), /empresa/);
  assert.throws(() => buildBudgetDocumentData({ ...input, issueDate: 'invalid' }), /data/);
  const badDimensions = structuredClone(input); badDimensions.source.budget.measurements.length = 0;
  assert.throws(() => buildBudgetDocumentData(badDimensions), /medidas/);
  const badPricing = structuredClone(input); badPricing.source.pricing.total = -1;
  assert.throws(() => buildBudgetDocumentData(badPricing), /valores/);
  const badService = document(); badService.service = 'details';
  assert.throws(() => assertBudgetDocumentData(badService), /serviço/);
  const badTotal = document(); badTotal.pricing.total = 1;
  assert.throws(() => buildBudgetPdfHtml(badTotal), /valores/);
});
test('formats issue date in Sao Paulo independently of host timezone', () => {
  assert.equal(formatIssueDate('2026-10-15T01:00:00.000Z'), '14/10/2026');
});
test('document snapshots do not mutate source profiles or budgets', () => {
  const fixture = documentFixtures();
  const input = { ...fixture, source: fixture.sources[0] };
  const before = structuredClone(input);
  const data = buildBudgetDocumentData(input);
  data.company.companyName = 'Outro'; data.client.name = 'Outra'; data.pricing.notes = 'Alterada';
  assert.deepEqual(input, before);
});
