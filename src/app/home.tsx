import { StatusBar } from 'expo-status-bar';
import { router, type Href } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BottomBar } from '@/components/home/bottom-bar';
import { BudgetHistoryList } from '@/components/history/budget-history-list';
import { ShortcutCard } from '@/components/home/shortcut-card';
import { Brand } from '@/constants/brand';
import { useSavedBudgets } from '@/hooks/use-saved-budgets';
import { useResponsiveLayout } from '@/hooks/use-responsive-layout';
import { savedBudgetDetailsRoute } from '@/utils/budget-history';
import { useLocalAccess } from '@/hooks/use-local-access';
import { useBudgetDraft } from '@/hooks/use-budget-draft';
import { useState } from 'react';
import { BudgetCard } from '@/components/budget/budget-card';
import { BudgetButton } from '@/components/budget/budget-screen';

export default function HomeScreen() {
  const { exit, error: accessError } = useLocalAccess();
  const [endingAccess, setEndingAccess] = useState(false);
  const { budgets, loading, error, retry } = useSavedBudgets();
  const { draft, status: draftStatus, error: draftError, discard, resume } = useBudgetDraft();
  const [confirmDraftDiscard, setConfirmDraftDiscard] = useState(false);
  const [draftActionError, setDraftActionError] = useState<string | null>(null);
  const { isWide, maxContentWidth, horizontalPadding } = useResponsiveLayout();
  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={[styles.content, { maxWidth: maxContentWidth, paddingHorizontal: horizontalPadding }]}>
          <View style={styles.header}>
            <View style={styles.greeting}>
              <Text accessibilityRole="header" style={styles.title}>Olá!</Text>
              <Text style={styles.subtitle}>Vamos construir grandes projetos hoje.</Text>
            </View>
          </View>

          <View style={[styles.dashboard, isWide && styles.dashboardWide]}>
            <View style={[styles.dashboardActions, isWide && styles.dashboardActionsWide]}>
              <Pressable accessibilityRole="button" onPress={() => router.push('/configuracoes/empresa')} style={styles.settings}>
                <Text style={styles.link}>Dados da GessoLider / profissional</Text>
              </Pressable>
              {!!accessError && <Text accessibilityRole="alert" style={styles.accessError}>{accessError}</Text>}
              <Pressable accessibilityRole="button" disabled={endingAccess} onPress={async () => {
                setEndingAccess(true);
                try { await exit(); router.replace('/login'); } catch {}
                finally { setEndingAccess(false); }
              }} style={styles.settings}>
                <Text style={styles.link}>{endingAccess ? 'Encerrando acesso…' : 'Encerrar acesso local'}</Text>
              </Pressable>

              <View style={styles.grid}>
                <ShortcutCard title="Novo Orçamento" icon={{ ios: 'doc.badge.plus', android: 'note_add', web: 'note_add' }} onPress={() => draft ? resume() : router.push('/orcamento/tipo-servico')} />
              </View>

              {draftStatus === 'loading' ? null : draftStatus === 'error' ? <BudgetCard title="Rascunho indisponível">
                <Text accessibilityRole="alert" style={styles.accessError}>{draftError}</Text>
                {!!draftActionError && <Text accessibilityRole="alert" style={styles.accessError}>{draftActionError}</Text>}
                {!confirmDraftDiscard ? <BudgetButton label="Descartar rascunho indisponível" onPress={() => { setDraftActionError(null); setConfirmDraftDiscard(true); }} /> : <View style={styles.confirmation}>
                  <Text style={styles.subtitle}>O rascunho que não pôde ser carregado será removido. Os orçamentos do histórico serão preservados.</Text>
                  <BudgetButton label="Confirmar descarte" onPress={async () => {
                    try { await discard(); setConfirmDraftDiscard(false); }
                    catch { setDraftActionError('Não foi possível remover o rascunho. Tente novamente.'); }
                  }} />
                  <BudgetButton label="Cancelar" onPress={() => setConfirmDraftDiscard(false)} />
                </View>}
              </BudgetCard> : draft && <BudgetCard title="Rascunho em andamento">
                <Text style={styles.subtitle}>Continue o orçamento interrompido para evitar substituir os dados deste rascunho.</Text>
                {!!draftActionError && <Text accessibilityRole="alert" style={styles.accessError}>{draftActionError}</Text>}
                <BudgetButton label="Continuar rascunho" onPress={resume} />
                {!confirmDraftDiscard ? <BudgetButton label="Descartar rascunho" onPress={() => { setDraftActionError(null); setConfirmDraftDiscard(true); }} /> : <View style={styles.confirmation}>
                  <Text style={styles.subtitle}>O rascunho em andamento será removido deste dispositivo. Orçamentos já salvos não serão excluídos.</Text>
                  <BudgetButton label="Confirmar descarte" onPress={async () => {
                    try { await discard(); setConfirmDraftDiscard(false); }
                    catch { setDraftActionError('Não foi possível descartar o rascunho. Tente novamente.'); }
                  }} />
                  <BudgetButton label="Cancelar" onPress={() => setConfirmDraftDiscard(false)} />
                </View>}
              </BudgetCard>}

              <View style={styles.banner}>
                <View style={styles.blueprint} />
                <Text style={styles.bannerText}>Planeje, calcule e{'\n'}apresente orçamentos{'\n'}com mais profissionalismo.</Text>
              </View>
            </View>

          <View style={[styles.section, isWide && styles.sectionWide]}>
            <View style={styles.sectionHeader}>
              <Text accessibilityRole="header" style={styles.sectionTitle}>Orçamentos recentes</Text>
              <Pressable accessibilityRole="button" onPress={() => router.push('/orcamentos' as Href)} style={styles.seeAll}>
                <Text style={styles.link}>Ver todos</Text>
              </Pressable>
            </View>
            <BudgetHistoryList budgets={budgets} loading={loading} error={error} onRetry={retry} recentLimit={3}
              onOpen={(id) => router.push(savedBudgetDetailsRoute(id))}
              onCreate={() => draft ? resume() : router.push('/orcamento/tipo-servico')} />
          </View>
          </View>
        </View>
      </ScrollView>
      <BottomBar />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Brand.white },
  scroll: { flexGrow: 1, alignItems: 'center' },
  content: { width: '100%', alignSelf: 'center', paddingTop: 24, paddingBottom: 24, gap: 24 },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  greeting: { flex: 1, minWidth: 0, gap: 8 },
  title: { fontSize: 26, fontWeight: '700', color: Brand.dark },
  subtitle: { fontSize: 14, lineHeight: 21, color: '#60706A' },
  settings: { minHeight: 48, justifyContent: 'center', padding: 14, borderWidth: 1, borderColor: '#C5CECA', borderRadius: 12 },
  dashboard: { gap: 24 },
  dashboardWide: { flexDirection: 'row', alignItems: 'flex-start' },
  dashboardActions: { gap: 24 },
  dashboardActionsWide: { flex: 0.9, minWidth: 0 },
  sectionWide: { flex: 1.1, minWidth: 0 },
  grid: { gap: 12 },
  banner: { backgroundColor: Brand.dark, borderRadius: 18, padding: 20, overflow: 'hidden', justifyContent: 'center', minHeight: 144 },
  blueprint: { pointerEvents: 'none', position: 'absolute', right: -25, top: 15, width: 110, height: 140, borderWidth: 2, borderColor: Brand.accent, opacity: 0.18, transform: [{ rotate: '20deg' }] },
  bannerText: { color: Brand.white, fontSize: 18, lineHeight: 27, fontWeight: '600' },
  section: { gap: 12 },
  sectionHeader: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  sectionTitle: { fontSize: 19, fontWeight: '700', color: Brand.dark, flexShrink: 1 },
  seeAll: { minHeight: 44, justifyContent: 'center' },
  link: { fontSize: 13, fontWeight: '600', color: Brand.primary },
  accessError: { color: '#A33232', fontSize: 13, lineHeight: 20 },
  confirmation: { gap: 10 },
});
