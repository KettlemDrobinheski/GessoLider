import { useEffect, useMemo, useRef, useState } from 'react';
import { Modal, Platform, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import type { BudgetDocumentSource } from '@/types/budget-document';
import type { ClientData } from '@/types/client';
import { useCompanyProfile } from '@/hooks/use-company-profile';
import { buildBudgetDocumentData } from '@/utils/budget-document';
import { generateBudgetPdf, shareBudgetPdf, type GeneratedBudgetPdf } from '@/services/budget-pdf';
import { BudgetButton, BudgetScreen } from './budget-screen';
import { BudgetDocument } from './budget-document';
import { getOrGenerateBudgetPdf } from '@/utils/budget-pdf-action';
import { savedBudgetsRepository } from '@/services/saved-budgets';
import type { CompanyProfile } from '@/types/company-profile';

export function BudgetDocumentPreview({ source, client, savedBudgetId, serviceDescription }: { source: BudgetDocumentSource; client: ClientData | null; savedBudgetId?: string; serviceDescription?: string }) {
  const { profile, loading, loadError } = useCompanyProfile();
  const [issueDate] = useState(() => new Date().toISOString());
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [savedCompany, setSavedCompany] = useState<CompanyProfile | null>(null);
  const [savedCompanyLoading, setSavedCompanyLoading] = useState(!!savedBudgetId);
  const [savedCompanyError, setSavedCompanyError] = useState<string | null>(null);
  const lock = useRef(false);
  const generated = useRef<{ key: string; pdf: GeneratedBudgetPdf } | null>(null);
  useEffect(() => {
    let active = true;
    if (!savedBudgetId) { setSavedCompany(null); setSavedCompanyLoading(false); setSavedCompanyError(null); return () => { active = false; }; }
    setSavedCompany(null); setSavedCompanyLoading(true); setSavedCompanyError(null);
    void savedBudgetsRepository.getById(savedBudgetId).then((record) => {
      if (!active) return;
      if (!record) setSavedCompanyError('Não foi possível recuperar a empresa registrada neste orçamento.');
      else setSavedCompany(record.company);
    }).catch(() => { if (active) setSavedCompanyError('Não foi possível recuperar os dados históricos da empresa.'); })
      .finally(() => { if (active) setSavedCompanyLoading(false); });
    return () => { active = false; };
  }, [savedBudgetId]);
  const result = useMemo(() => {
    try {
      if (savedBudgetId && !savedCompany) throw new Error(savedCompanyError ?? 'Carregando os dados históricos da empresa.');
      return { data: buildBudgetDocumentData({ company: savedCompany ?? profile, client, source, issueDate, serviceDescription }), error: null };
    }
    catch (error) { return { data: null, error: error instanceof Error ? error.message : 'Revise os dados do orçamento.' }; }
  }, [profile, client, source, issueDate, savedBudgetId, savedCompany, savedCompanyError, serviceDescription]);
  const currentProfileUnavailable = !savedBudgetId && (loading || !!loadError);
  async function generate(share: boolean) {
    if (!result.data || lock.current || currentProfileUnavailable) return;
    lock.current = true;
    setBusy(true); setFeedback('Gerando orçamento…');
    try {
      const key = JSON.stringify(result.data);
      const pdf = await getOrGenerateBudgetPdf(Platform.OS, key, generated, () => generateBudgetPdf(result.data!));
      if (share) { await shareBudgetPdf(pdf); setFeedback('Opções de compartilhamento abertas.'); }
      else if (Platform.OS === 'web') setFeedback('A impressão foi aberta. Escolha “Salvar como PDF” para baixar ou selecione uma impressora.');
      else setFeedback(`PDF gerado: ${pdf.filename}. Use Compartilhar orçamento para salvar ou enviar.`);
    } catch (error) {
      generated.current = null;
      setFeedback(error instanceof Error ? error.message : 'Não foi possível concluir a ação. Tente novamente.');
    } finally { lock.current = false; setBusy(false); }
  }
  const unavailable = currentProfileUnavailable || savedCompanyLoading || !!savedCompanyError || !result.data;
  return <>
    {(result.error || (!savedBudgetId && loadError)) && <Text accessibilityRole="alert" style={styles.note}>{(!savedBudgetId && loadError) || result.error}</Text>}
    <BudgetButton label="Visualizar orçamento final" disabled={unavailable} onPress={() => { setFeedback(null); setVisible(true); }} />
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={() => { if (!lock.current) setVisible(false); }}>
      <SafeAreaProvider>
        <BudgetScreen title="Orçamento final" headerTitle="Pré-visualização" showBottomNavigation={false} onBack={() => { if (!lock.current) setVisible(false); }}
          footer={<View style={styles.actions}>
            {Platform.OS === 'web' && <Text style={styles.note}>Prévia para impressão. No diálogo do navegador, escolha uma impressora ou “Salvar como PDF”.</Text>}
            {!!feedback && <Text accessibilityRole="alert" style={styles.note}>{feedback}</Text>}
            <BudgetButton label={busy ? 'Preparando…' : Platform.OS === 'web' ? 'Imprimir / salvar como PDF' : 'Gerar PDF'} disabled={busy || unavailable} onPress={() => { void generate(false); }} />
            {Platform.OS !== 'web' && <BudgetButton label="Compartilhar orçamento" disabled={busy || unavailable} onPress={() => { void generate(true); }} />}
          </View>}>
          {result.data && <BudgetDocument data={result.data} />}
        </BudgetScreen>
      </SafeAreaProvider>
    </Modal>
  </>;
}

const styles = StyleSheet.create({ actions: { gap: 10 }, note: { color: '#60706A', fontSize: 13, lineHeight: 20 } });
