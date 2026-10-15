import { Platform } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Directory, File, Paths } from 'expo-file-system';
import type { BudgetDocumentData } from '@/types/budget-document';
import { assertBudgetDocumentData, budgetPdfFilename } from '@/utils/budget-document';
import { buildBudgetPdfHtml } from './budget-pdf-template';

export type GeneratedBudgetPdf = { uri: string; filename: string };
let generating = false;

async function readLogoData(uri: string | null): Promise<string | null> {
  if (!uri) return null;
  if (/^data:image\/(?:png|jpeg|webp);base64,[a-zA-Z0-9+/=]+$/.test(uri)) return uri;
  if (!uri.startsWith('file://')) return null;
  const extension = uri.split('.').pop()?.toLowerCase();
  const mime = extension === 'png' ? 'image/png' : extension === 'jpg' || extension === 'jpeg' ? 'image/jpeg' : extension === 'webp' ? 'image/webp' : null;
  if (!mime) return null;
  try { return `data:${mime};base64,${await new File(uri).base64()}`; } catch { return null; }
}

export async function generateBudgetPdf(data: BudgetDocumentData): Promise<GeneratedBudgetPdf> {
  if (Platform.OS === 'web') throw new Error('A geração de PDF está disponível no aplicativo Android/iOS.');
  if (generating) throw new Error('Aguarde a geração do orçamento atual.');
  assertBudgetDocumentData(data);
  generating = true;
  let temporary: File | null = null;
  let destination: File | null = null;
  try {
    const logo = await readLogoData(data.company.logoUri);
    const result = await Print.printToFileAsync({ html: buildBudgetPdfHtml(data, logo), width: 595.28, height: 841.89 });
    temporary = new File(result.uri);
    if (!temporary.exists || temporary.size === 0) throw new Error('O PDF não foi criado.');
    const filename = budgetPdfFilename(data);
    const directory = new Directory(Paths.cache, 'gessolider-orcamentos', `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`);
    directory.create({ intermediates: true, idempotent: true });
    destination = new File(directory, filename);
    temporary.move(destination);
    return { uri: destination.uri, filename };
  } catch {
    for (const file of [temporary, destination]) {
      try { if (file?.exists) file.delete(); } catch { /* A limpeza do cache não deve ocultar o erro de geração. */ }
    }
    throw new Error('Não foi possível gerar o PDF. Tente novamente.');
  } finally { generating = false; }
}

export async function shareBudgetPdf(pdf: GeneratedBudgetPdf): Promise<void> {
  if (Platform.OS === 'web') throw new Error('O compartilhamento do PDF está disponível no aplicativo Android/iOS.');
  let available: boolean;
  try { available = await Sharing.isAvailableAsync(); }
  catch { throw new Error('Não foi possível verificar o compartilhamento neste dispositivo.'); }
  if (!available) throw new Error('O compartilhamento não está disponível neste dispositivo.');
  try {
    if (!new File(pdf.uri).exists) throw new Error('missing');
  } catch { throw new Error('O PDF não está mais disponível. Gere o orçamento novamente.'); }
  try { await Sharing.shareAsync(pdf.uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf', dialogTitle: 'Compartilhar orçamento' }); }
  catch { throw new Error('Não foi possível abrir o compartilhamento. Tente novamente.'); }
}
