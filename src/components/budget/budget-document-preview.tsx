import { useMemo, useRef, useState } from 'react';
import { Modal, Platform, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import type { BudgetDocumentSource } from '@/types/budget-document';
import type { ClientData } from '@/types/client';
import { useCompanyProfile } from '@/hooks/use-company-profile';
import { buildBudgetDocumentData } from '@/utils/budget-document';
import { generateBudgetPdf, shareBudgetPdf, type GeneratedBudgetPdf } from '@/services/budget-pdf';
import { BudgetButton, BudgetScreen } from './budget-screen';
import { BudgetDocument } from './budget-document';

export function BudgetDocumentPreview({ source, client }: { source: BudgetDocumentSource; client: ClientData | null }) {
  const { profile, loading, loadError } = useCompanyProfile();
  const [issueDate] = useState(() => new Date().toISOString());
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const lock = useRef(false);
  const generated = useRef<{ key: string; pdf: GeneratedBudgetPdf } | null>(null);
  const result = useMemo(() => {
    try { return { data: buildBudgetDocumentData({ company: profile, client, source, issueDate }), error: null }; }
    catch (error) { return { data: null, error: error instanceof Error ? error.message : 'Revise os dados do orçamento.' }; }
  }, [profile, client, source, issueDate]);
  async function generate(share: boolean) {
    if (!result.data || lock.current || loading || loadError) return;
    lock.current = true;
    setBusy(true); setFeedback('Gerando orçamento…');
    try {
      const key = JSON.stringify(result.data);
      const pdf = generated.current?.key === key ? generated.current.pdf : await generateBudgetPdf(result.data);
      generated.current = { key, pdf };
      if (share) { await shareBudgetPdf(pdf); setFeedback('Opções de compartilhamento abertas.'); }
      else setFeedback(`PDF gerado: ${pdf.filename}. Use Compartilhar orçamento para salvar ou enviar.`);
    } catch (error) {
      generated.current = null;
      setFeedback(error instanceof Error ? error.message : 'Não foi possível concluir a ação. Tente novamente.');
    } finally { lock.current = false; setBusy(false); }
  }
  const unavailable = loading || !!loadError || !result.data;
  return <>
    {(result.error || loadError) && <Text accessibilityRole="alert" style={styles.note}>{loadError || result.error}</Text>}
    <BudgetButton label="Visualizar orçamento final" disabled={unavailable} onPress={() => { setFeedback(null); setVisible(true); }} />
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={() => { if (!lock.current) setVisible(false); }}>
      <SafeAreaProvider>
        <BudgetScreen title="Orçamento final" headerTitle="Pré-visualização" onBack={() => { if (!lock.current) setVisible(false); }}
          footer={<View style={styles.actions}>
            {Platform.OS === 'web' && <Text style={styles.note}>A geração e o compartilhamento do PDF estão disponíveis no aplicativo Android/iOS.</Text>}
            {!!feedback && <Text accessibilityRole="alert" style={styles.note}>{feedback}</Text>}
            <BudgetButton label={busy ? 'Gerando orçamento…' : 'Gerar PDF'} disabled={busy || unavailable || Platform.OS === 'web'} onPress={() => { void generate(false); }} />
            <BudgetButton label="Compartilhar orçamento" disabled={busy || unavailable || Platform.OS === 'web'} onPress={() => { void generate(true); }} />
          </View>}>
          {result.data && <BudgetDocument data={result.data} />}
        </BudgetScreen>
      </SafeAreaProvider>
    </Modal>
  </>;
}

const styles = StyleSheet.create({ actions: { gap: 10 }, note: { color: '#60706A', fontSize: 13, lineHeight: 20 } });
