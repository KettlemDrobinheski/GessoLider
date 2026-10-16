import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { SavedBudget } from '@/types/saved-budget';
import { RecentBudgetCard } from '@/components/home/recent-budget-card';
import { Brand } from '@/constants/brand';
import { budgetHistoryState } from '@/utils/budget-history';

type Props = {
  budgets: SavedBudget[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  onOpen: (id: string) => void;
  recentLimit?: number;
};

export function BudgetHistoryList({ budgets, loading, error, onRetry, onOpen, recentLimit }: Props) {
  const visibleBudgets = recentLimit ? budgets.slice(0, recentLimit) : budgets;
  const state = budgetHistoryState(budgets, loading, error);
  if (state === 'loading') return <Text accessibilityRole="alert" style={styles.message}>Carregando orçamentos…</Text>;
  if (state === 'error') return <View style={styles.messageBlock}>
    <Text accessibilityRole="alert" style={styles.message}>{error}</Text>
    <Pressable accessibilityRole="button" onPress={onRetry} style={styles.retry}><Text style={styles.retryText}>Tentar novamente</Text></Pressable>
  </View>;
  if (state === 'empty') return <Text style={styles.message}>Nenhum orçamento salvo ainda.</Text>;
  return <View style={styles.list}>
    {visibleBudgets.map((budget) => <RecentBudgetCard key={budget.id} budget={budget} onPress={() => onOpen(budget.id)} />)}
  </View>;
}

const styles = StyleSheet.create({
  list: { gap: 12 },
  messageBlock: { gap: 12, paddingVertical: 8 },
  message: { color: '#60706A', fontSize: 14, lineHeight: 21 },
  retry: { minHeight: 44, justifyContent: 'center', alignSelf: 'flex-start' },
  retryText: { color: Brand.primary, fontSize: 14, fontWeight: '600' },
});
