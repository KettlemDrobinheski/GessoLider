import { useState } from 'react';
import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import type { NewSavedBudget } from '@/types/saved-budget';
import { savedBudgetsRepository } from '@/services/saved-budgets';
import { saveBudgetRecord } from '@/utils/budget-history';
import { BudgetButton } from './budget-screen';

export function SaveBudgetAction({ input, savedId, unavailableMessage }: { input: NewSavedBudget | null; savedId?: string; unavailableMessage?: string }) {
  const [currentId, setCurrentId] = useState(savedId);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    if (!input || saving) return;
    setSaving(true);
    setFeedback(null);
    setError(null);
    try {
      const record = await saveBudgetRecord(savedBudgetsRepository, input, currentId);
      setCurrentId(record.id);
      router.setParams({ orcamentoSalvoId: record.id });
      setFeedback('Orçamento salvo no histórico.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível salvar. Tente novamente.');
    } finally {
      setSaving(false);
    }
  }

  return <View style={styles.container}>
    {!input && <Text style={styles.note}>{unavailableMessage ?? 'Informe os dados do cliente antes de salvar o orçamento.'}</Text>}
    {!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
    {!!feedback && <Text accessibilityRole="alert" style={styles.success}>{feedback}</Text>}
    <BudgetButton label={saving ? 'Salvando…' : currentId ? 'Atualizar orçamento salvo' : 'Salvar orçamento no histórico'}
      disabled={!input || saving} onPress={() => { void save(); }} />
  </View>;
}

const styles = StyleSheet.create({
  container: { gap: 10 },
  note: { color: '#60706A', fontSize: 13, lineHeight: 20 },
  error: { color: '#A33232', fontSize: 13, lineHeight: 20 },
  success: { color: '#087354', fontSize: 13, lineHeight: 20 },
});
