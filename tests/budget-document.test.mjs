import assert from 'node:assert/strict';
import test from 'node:test';
import './register-typescript.mjs';
import { documentFixtures } from './budget-document-fixtures.mjs';
const { buildBudgetDocumentData, assertBudgetDocumentData, budgetPdfFilename, formatIssueDate, toCustomerBudgetDocument } = await import('../src/utils/budget-document.ts');
const { suggestServiceDescription } = await import('../src/utils/service-description.ts');
const { buildBudgetPdfHtml, escapeHtml } = await import('../src/services/budget-pdf-template.ts');
const { formatClientAddress } = await import('../src/utils/client.ts');
const { formatBRL } = await import('../src/utils/currency.ts');
const { materialEstimateNotice } = await import('../src/constants/budget-document.ts');
const { calculateWallMaterials } = await import('../src/domain/calculations/wallMaterials.ts');

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
test('wall document retains internal estimates and hides them from the customer PDF', () => {
  const data = document();
  const configuration = Object.fromEntries(data.configuration.map(({ label, value }) => [label, value]));
  assert.equal(configuration['Estimativa das guias'], 'As guias são estimadas pela metragem total, sem plano de corte das peças.');
  assert.equal(configuration['Premissa do isolamento'], 'Área interna da parede, sem conversão para rolos, pacotes ou placas.');
  assert.equal(configuration['Premissa da banda acústica'], 'Estimativa por área, sem levantamento linear detalhado dos encontros da parede.');
  const html = buildBudgetPdfHtml(data);
  assert.ok(Object.values(configuration).some((value) => /estimadas pela metragem/.test(value)));
  assert.ok(!html.includes('Estimativa das guias'));
  assert.ok(!html.includes(materialEstimateNotice));
});
test('wall document includes insulation and acoustic band notices only when selected', () => {
  const fixture = documentFixtures();
  const source = fixture.sources[0];
  source.budget.configuration.insulation = null;
  source.budget.configuration.acousticBand = false;
  source.materials = calculateWallMaterials({ ...source.budget.measurements, ...source.budget.configuration });
  const data = buildBudgetDocumentData({ ...fixture, source });
  const labels = data.configuration.map(({ label }) => label);
  assert.ok(labels.includes('Estimativa das guias'));
  assert.ok(!labels.includes('Premissa do isolamento'));
  assert.ok(!labels.includes('Premissa da banda acústica'));
});
test('wall document includes metal-metal screws only while their status is to-define', () => {
  const fixture = documentFixtures();
  const source = fixture.sources[0];
  assert.equal(source.materials.consumables.metalScrews.status, 'to-define');
  assert.ok(document().materials.some(({ label, value }) => label === 'Parafusos metal-metal' && value === 'Quantidade a definir'));
  source.materials.consumables.metalScrews.status = 'estimated';
  const data = buildBudgetDocumentData({ ...fixture, source });
  assert.ok(!data.materials.some(({ label }) => label === 'Parafusos metal-metal'));
});
test('ceiling document includes F530 and angles and no wall-only materials', () => {
  const data = document(1);
  const labels = data.materials.map((item) => item.label).join(' ');
  for (const expected of ['Placa ST', 'F530', 'Cantoneira', 'G25', 'Caixa com 1.000', 'Fita', 'Massa']) assert.ok(labels.includes(expected));
  for (const excluded of ['Guia', 'Montante', 'Lã', 'Banda']) assert.ok(!labels.includes(excluded));
  assert.equal(data.materials.find((item) => item.label.includes('F530')).value, '24 barras');
  assert.equal(data.materials.find((item) => item.label.includes('Cantoneira')).value, '9 peças');
  const configuration = Object.fromEntries(data.configuration.map(({ label, value }) => [label, value]));
  assert.match(configuration['Orientação estimada de F530'], /sentido do comprimento.*distribuídas ao longo da largura/);
  assert.match(configuration['Premissa de F530 e cantoneiras'], /por trecho e por peças comerciais/);
  assert.match(configuration['Premissa de F530 e cantoneiras'], /não é um plano de montagem/);
  assert.match(configuration['Premissa de F530 e cantoneiras'], /não define emendas/);
  assert.match(configuration['Premissa de F530 e cantoneiras'], /não calcula o aproveitamento real das sobras/);
  for (const accessory of ['tirantes', 'presilhas', 'reguladores', 'conectores', 'buchas', 'fixadores']) {
    assert.ok(configuration['Acessórios não incluídos'].includes(accessory), accessory);
  }
});
test('ceiling PDF hides internal orientation, estimates and accessories configuration', () => {
  const data = document(1);
  const html = buildBudgetPdfHtml(data);
  for (const notice of [
    'sentido do comprimento do ambiente, distribuídas ao longo da largura',
    'não é um plano de montagem',
    'não define emendas',
    'não calcula o aproveitamento real das sobras',
    'não inclui acessórios de suspensão e ancoragem',
    'tirantes, presilhas, reguladores, conectores, buchas e fixadores',
  ]) assert.ok(!html.includes(notice), notice);
  for (const index of [0, 2]) {
    const otherServiceHtml = buildBudgetPdfHtml(document(index));
    assert.ok(!otherServiceHtml.includes('Orientação estimada de F530'));
    assert.ok(!otherServiceHtml.includes('acessórios de suspensão e ancoragem'));
  }
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
for (const [index, service, changeBudget] of [
  [0, 'wall', (budget) => { budget.measurements.length = 5; }],
  [1, 'ceiling', (budget) => { budget.configuration.spacingCm = 60; }],
  [2, 'lining', (budget) => { budget.configuration.wastePercent = 0; }],
]) {
  test(`rejects ${service} materials calculated from different budget inputs`, () => {
    const fixture = documentFixtures();
    const source = fixture.sources[index];
    source.budget = structuredClone(source.budget);
    changeBudget(source.budget);
    assert.throws(() => buildBudgetDocumentData({ ...fixture, source }), /não correspondem às medidas e configurações/);
  });
}
test('each service exposes only its own dimensions and configuration', () => {
  assert.deepEqual(document().measurements.map((item) => item.label), ['Comprimento', 'Altura', 'Área']);
  assert.deepEqual(document(1).measurements.map((item) => item.label), ['Comprimento', 'Largura', 'Área']);
  assert.deepEqual(document(2).measurements.map((item) => item.label), ['Largura', 'Altura', 'Área']);
  assert.deepEqual(document(2).configuration.map((item) => item.label), ['Perda']);
  assert.deepEqual(document(1).configuration.map((item) => item.label), ['Espaçamento', 'Orientação estimada de F530', 'Premissa de F530 e cantoneiras', 'Acessórios não incluídos', 'Perda']);
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
test('each service renders customer data and total without internal cost or material composition', () => {
  for (let i = 0; i < 3; i++) {
    const data = document(i);
    const html = buildBudgetPdfHtml(data);
    for (const value of [data.company.companyName, data.client.name, data.serviceName, formatBRL(data.pricing.total), 'ORÇAMENTO', 'Valor do serviço', 'TOTAL GERAL']) assert.ok(html.includes(escapeHtml(value)), value);
    assert.match(html, /size: A4 portrait/);
    assert.match(html, /table-header-group/);
    for (const { label, value } of data.measurements) {
      const row = `<tr><td>${escapeHtml(label)}</td><td class="value">${escapeHtml(value)}</td></tr>`;
      assert.ok(html.includes(row), `${data.service}: ${label} / ${value}`);
    }
    for (const { label, value } of [...data.configuration, ...data.materials]) {
      assert.ok(!html.includes(escapeHtml(label)), `${data.service}: hidden label ${label}`);
      assert.ok(!html.includes(escapeHtml(value)), `${data.service}: hidden value ${value}`);
    }
    assert.ok(!html.includes(formatBRL(data.pricing.materialsTotal)));
    assert.ok(!html.includes(formatBRL(data.pricing.laborTotal)));
    assert.equal(html.split(formatBRL(data.pricing.total)).length - 1, 2);
  }
});
test('customer projection contains no internal composition and preserves the calculated total', () => {
  for (let i = 0; i < 3; i++) {
    const data = document(i);
    const customerDocument = toCustomerBudgetDocument(data);
    const html = buildBudgetPdfHtml(data);
    assert.equal(customerDocument.total, data.pricing.total);
    assert.equal(customerDocument.serviceValue, data.pricing.total);
    assert.ok(!('materials' in customerDocument));
    assert.ok(!('configuration' in customerDocument));
    assert.ok(!('pricing' in customerDocument));
    assert.ok(!html.includes('Materiais estimados'));
    assert.ok(!html.includes('Valor dos materiais'));
    assert.ok(!html.includes('Mão de obra'));
    assert.ok(!html.includes(escapeHtml(materialEstimateNotice)));
  }
});
test('service description suggestions use only selected service, known dimensions and available location', () => {
  const fixture = documentFixtures();
  assert.match(suggestServiceDescription('wall', fixture.client, { length: 4, height: 2.7 }), /parede de drywall.*4 m.*2.7 m.*Rua das Flores/);
  assert.equal(suggestServiceDescription('ceiling'), 'Execução de forro de drywall.');
  const custom = 'Instalação conforme alinhado com o cliente.';
  const data = buildBudgetDocumentData({ ...fixture, source: fixture.sources[0], serviceDescription: custom });
  assert.equal(data.serviceDescription, custom);
  assert.equal(toCustomerBudgetDocument(data).serviceDescription, custom);
  assert.equal(toCustomerBudgetDocument(data).total, data.pricing.total);
  const html = buildBudgetPdfHtml(data);
  assert.ok(html.includes('Descrição dos Serviços Contratados'));
  assert.ok(html.includes(custom));
  assert.ok(!html.includes('Valor dos materiais'));
  assert.ok(!html.includes('Mão de obra'));
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
  data.client.notes = input; data.notes = input; data.company.commercialNote = input;
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
