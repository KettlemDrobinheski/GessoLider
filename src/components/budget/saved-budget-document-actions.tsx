import { useMemo, useState } from 'react';
import { Modal, Platform, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import type { SavedBudget } from '@/types/saved-budget';
import { buildSavedBudgetDocumentData } from '@/utils/budget-document';
import { generateBudgetPdf, shareBudgetPdf } from '@/services/budget-pdf';
import { BudgetButton, BudgetScreen } from './budget-screen';
import { BudgetDocument } from './budget-document';
import { performBudgetPdfOperation, savedBudgetPdfActionLabels } from '@/utils/budget-pdf-action';

export function SavedBudgetDocumentActions({ budget }: { budget: SavedBudget }) {
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const document = useMemo(() => {
    try { return { data: buildSavedBudgetDocumentData(budget), error: null }; }
    catch (error) { return { data: null, error: error instanceof Error ? error.message : 'Não foi possível reconstruir o documento.' }; }
  }, [budget]);

  async function run(shouldShare: boolean) {
    if (!document.data || busy) return;
    setBusy(true);
    setFeedback('Gerando PDF…');
    try {
      const pdf = await performBudgetPdfOperation(shouldShare, {
        generate: () => generateBudgetPdf(document.data!),
        share: shareBudgetPdf,
      });
      if (Platform.OS === 'web') {
        setFeedback('A impressão foi aberta. Escolha “Salvar como PDF” para baixar ou selecione uma impressora.');
      } else if (shouldShare) {
        setFeedback('PDF pronto para compartilhar.');
      } else setFeedback(`PDF gerado: ${pdf.filename}. Use Compartilhar PDF para salvar ou enviar.`);
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Não foi possível gerar ou compartilhar o PDF. Tente novamente.');
    } finally { setBusy(false); }
  }

  return <>
    {!!document.error && <Text accessibilityRole="alert" style={styles.note}>{document.error}</Text>}
    <BudgetButton label={savedBudgetPdfActionLabels[0]} disabled={!document.data} onPress={() => { setFeedback(null); setVisible(true); }} />
    {Platform.OS !== 'web' && <BudgetButton label={busy ? 'Gerando PDF…' : savedBudgetPdfActionLabels[1]} disabled={busy || !document.data} onPress={() => { void run(false); }} />}
    {Platform.OS !== 'web' && <BudgetButton label={savedBudgetPdfActionLabels[2]} disabled={busy || !document.data} onPress={() => { void run(true); }} />}
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={() => setVisible(false)}>
      <SafeAreaProvider>
        <BudgetScreen title="Orçamento" headerTitle="Pré-visualização" showBottomNavigation={false} onBack={() => setVisible(false)}
          footer={<View style={styles.footer}>
            {Platform.OS === 'web' && <Text style={styles.note}>Prévia para impressão. No diálogo do navegador, escolha uma impressora ou “Salvar como PDF”.</Text>}
            {!!feedback && <Text accessibilityRole="alert" style={styles.note}>{feedback}</Text>}
            <BudgetButton label={busy ? 'Preparando…' : Platform.OS === 'web' ? 'Imprimir / salvar como PDF' : 'Gerar PDF'} disabled={busy || !document.data} onPress={() => { void run(false); }} />
            {Platform.OS !== 'web' && <BudgetButton label="Compartilhar PDF" disabled={busy || !document.data} onPress={() => { void run(true); }} />}
          </View>}>
          {document.data && <BudgetDocument data={document.data} />}
        </BudgetScreen>
      </SafeAreaProvider>
    </Modal>
  </>;
}

const styles = StyleSheet.create({ footer: { gap: 10 }, note: { color: '#60706A', fontSize: 13, lineHeight: 20 } });
