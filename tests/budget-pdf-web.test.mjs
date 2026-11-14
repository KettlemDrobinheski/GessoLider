import assert from 'node:assert/strict';
import test from 'node:test';
import './register-typescript.mjs';
import { documentFixtures } from './budget-document-fixtures.mjs';

const { buildBudgetDocumentData } = await import('../src/utils/budget-document.ts');
const { generateBudgetPdf } = await import('../src/services/budget-pdf.web.ts');
const { getOrGenerateBudgetPdf } = await import('../src/utils/budget-pdf-action.ts');

test('web PDF action opens the shared customer HTML in a printable browser document', async () => {
  const fixture = documentFixtures();
  const data = buildBudgetDocumentData({ ...fixture, source: fixture.sources[0] });
  let html = '';
  let printed = false;
  const printWindow = {
    document: { open() {}, write(value) { html = value; }, close() {} },
    location: { href: 'about:blank' },
    focus() {}, print() { printed = true; }, close() {},
  };
  const previousWindow = globalThis.window;
  globalThis.window = { open: () => printWindow };
  try {
    const result = await generateBudgetPdf(data);
    assert.equal(printed, true);
    assert.equal(result.filename, 'Orcamento-GessoLider-Joao-da-Silva.pdf');
    assert.ok(html.includes('TOTAL GERAL'));
    assert.ok(html.includes('Descrição dos Serviços Contratados'));
    assert.ok(html.includes(data.serviceDescription));
    assert.ok(html.includes(data.pricing.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })));
    assert.ok(!html.includes('Materiais estimados'));
    assert.ok(!html.includes('Valor dos materiais'));
    assert.ok(!html.includes('Mão de obra'));
    for (const material of data.materials) assert.ok(!html.includes(material.label));
  } finally {
    if (previousWindow === undefined) delete globalThis.window;
    else globalThis.window = previousWindow;
  }
});

test('web PDF action reports when the browser blocks the print window', async () => {
  const fixture = documentFixtures();
  const data = buildBudgetDocumentData({ ...fixture, source: fixture.sources[0] });
  const previousWindow = globalThis.window;
  globalThis.window = { open: () => null };
  try {
    await assert.rejects(generateBudgetPdf(data), /bloqueou a janela/);
  } finally {
    if (previousWindow === undefined) delete globalThis.window;
    else globalThis.window = previousWindow;
  }
});

test('consecutive web print attempts always call print again even with a stale cached result', async () => {
  const fixture = documentFixtures();
  const data = buildBudgetDocumentData({ ...fixture, source: fixture.sources[0] });
  let printCount = 0;
  const previousWindow = globalThis.window;
  globalThis.window = {
    open: () => ({
      document: { open() {}, write() {}, close() {} },
      location: { href: 'about:blank' },
      focus() {}, print() { printCount += 1; }, close() {},
    }),
  };
  const cache = { current: { key: 'same-document', pdf: { uri: 'about:blank', filename: 'previous-attempt.pdf' } } };
  try {
    await getOrGenerateBudgetPdf('web', 'same-document', cache, () => generateBudgetPdf(data));
    await getOrGenerateBudgetPdf('web', 'same-document', cache, () => generateBudgetPdf(data));
    assert.equal(printCount, 2);
    assert.equal(cache.current, null);
  } finally {
    if (previousWindow === undefined) delete globalThis.window;
    else globalThis.window = previousWindow;
  }
});

test('native PDF results remain reusable between generation and sharing actions', async () => {
  const cache = { current: null };
  let generationCount = 0;
  const generate = async () => ({ uri: 'file://budget.pdf', filename: 'budget.pdf', attempt: ++generationCount });
  const first = await getOrGenerateBudgetPdf('ios', 'same-document', cache, generate);
  const second = await getOrGenerateBudgetPdf('ios', 'same-document', cache, generate);
  assert.equal(generationCount, 1);
  assert.equal(second, first);
});
