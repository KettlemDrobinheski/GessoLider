import type { BudgetDocumentData } from '../types/budget-document';
import { assertBudgetDocumentData, budgetPdfFilename } from '../utils/budget-document';
import { buildBudgetPdfHtml } from './budget-pdf-template';

export type GeneratedBudgetPdf = { uri: string; filename: string };

/** Open the customer document in a standalone browser tab and let the browser print or save it as PDF. */
export async function generateBudgetPdf(data: BudgetDocumentData): Promise<GeneratedBudgetPdf> {
  assertBudgetDocumentData(data);
  const printWindow = window.open('', '_blank');
  if (!printWindow) throw new Error('O navegador bloqueou a janela do documento. Permita pop-ups e tente novamente.');

  try {
    const logoUri = data.company.logoUri;
    const logo = logoUri && /^data:image\/(?:png|jpeg|webp);base64,[a-zA-Z0-9+/=]+$/.test(logoUri) ? logoUri : null;
    printWindow.document.open();
    printWindow.document.write(buildBudgetPdfHtml(data, logo));
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    return { uri: printWindow.location.href, filename: budgetPdfFilename(data) };
  } catch {
    printWindow.close();
    throw new Error('Não foi possível abrir a impressão do documento. Tente novamente.');
  }
}

export async function shareBudgetPdf(_pdf: GeneratedBudgetPdf): Promise<void> {
  throw new Error('No navegador, use Imprimir e escolha “Salvar como PDF” ou um destino de compartilhamento disponível.');
}
