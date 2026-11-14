import type { BudgetDocumentData, DocumentRow } from '../types/budget-document';
import { assertBudgetDocumentData, budgetPdfFilename, formatIssueDate, toCustomerBudgetDocument } from '../utils/budget-document';
import { formatClientAddress, formatPhone } from '../utils/client';
import { formatCompanySummary } from '../utils/company-profile';
import { formatBRL } from '../utils/currency';

export function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

export function buildBudgetPdfHtml(data: BudgetDocumentData, logoDataUri?: string | null): string {
  assertBudgetDocumentData(data);
  const customerDocument = toCustomerBudgetDocument(data);
  const e = escapeHtml;
  const companyLines = formatCompanySummary({ ...customerDocument.company, commercialNote: '' });
  const clientLines = [customerDocument.client.name, customerDocument.client.phone ? formatPhone(customerDocument.client.phone) : '', ...formatClientAddress(customerDocument.client),
    customerDocument.client.complement ? `Complemento: ${customerDocument.client.complement}` : '', customerDocument.client.notes ? `Observações: ${customerDocument.client.notes}` : ''].filter(Boolean);
  const rows = (items: DocumentRow[]) => items.map((item) => `<tr><td>${e(item.label)}</td><td class="value">${e(item.value)}</td></tr>`).join('');
  const lines = (items: string[]) => items.map((line) => `<p>${e(line)}</p>`).join('');
  const logo = logoDataUri && /^data:image\/(?:png|jpeg|webp);base64,[a-zA-Z0-9+/=]+$/.test(logoDataUri)
    ? `<img class="logo" alt="" src="${e(logoDataUri)}" />` : '';
  return `<!DOCTYPE html>
<html lang="pt-BR"><head><meta charset="utf-8" />
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data:; style-src 'unsafe-inline'" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${e(budgetPdfFilename(data).replace(/\.pdf$/, ''))}</title>
<style>
@page { size: A4 portrait; margin: 14mm; }
* { box-sizing: border-box; }
body { margin: 0; color: #24352e; font: 11.5px/1.45 Arial, sans-serif; }
header { border-bottom: 2px solid #123d35; padding-bottom: 12px; margin-bottom: 14px; break-inside: avoid; }
.logo { display: block; max-width: 180px; max-height: 65px; object-fit: contain; margin-bottom: 8px; }
h1 { color: #123d35; font-size: 25px; line-height: 1.2; margin: 0 0 6px; overflow-wrap: anywhere; }
h2 { color: #123d35; font-size: 12px; text-transform: uppercase; letter-spacing: .7px; margin: 18px 0 7px; break-after: avoid; }
p { margin: 3px 0; white-space: pre-wrap; overflow-wrap: anywhere; }
.identity { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; margin-bottom: 8px; }
.identity strong { font-size: 18px; color: #123d35; }
.date { color: #52665c; }
table { width: 100%; border-collapse: collapse; table-layout: fixed; }
thead { display: table-header-group; }
tr { break-inside: avoid; }
td, th { padding: 4px 7px; border-bottom: 1px solid #e2e8e4; text-align: left; vertical-align: top; overflow-wrap: anywhere; }
th { background: #edf4ef; font-weight: 600; }
.value { text-align: right; width: 34%; font-variant-numeric: tabular-nums; }
.totals { break-inside: avoid; margin-top: 16px; }
.total td { background: #eaf3ed; color: #123d35; font-size: 18px; font-weight: bold; border: 0; padding: 12px 7px; }
.notice { color: #60706a; font-size: 10px; margin-top: 14px; }
.service { font-weight: bold; font-size: 13px; }
</style></head><body>
<header>${logo}<h1>${e(companyLines[0])}</h1>${lines(companyLines.slice(1))}</header>
<div class="identity"><strong>ORÇAMENTO</strong><span class="date">Emissão: ${e(formatIssueDate(data.issueDate))}</span></div>
<section><h2>Cliente</h2>${lines(clientLines)}</section>
<section><h2>Serviço</h2><p class="service">${e(customerDocument.serviceName)}</p>
<h2>Descrição dos Serviços Contratados</h2><p>${e(customerDocument.serviceDescription)}</p>
<table><tbody>${rows(customerDocument.measurements)}</tbody></table>
<p class="service">Valor do serviço: ${e(formatBRL(customerDocument.serviceValue))}</p></section>
<section class="totals"><h2>Valores</h2><table><tbody>
<tr class="total"><td>TOTAL GERAL</td><td class="value">${e(formatBRL(customerDocument.total))}</td></tr>
</tbody></table></section>
${customerDocument.notes ? `<section><h2>Observações do orçamento</h2><p>${e(customerDocument.notes)}</p></section>` : ''}
${customerDocument.company.commercialNote ? `<section><h2>Observação comercial</h2><p>${e(customerDocument.company.commercialNote)}</p></section>` : ''}
</body></html>`;
}
