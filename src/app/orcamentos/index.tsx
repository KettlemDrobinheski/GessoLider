import { router } from 'expo-router';
import { BudgetHistoryList } from '@/components/history/budget-history-list';
import { BudgetScreen } from '@/components/budget/budget-screen';
import { useSavedBudgets } from '@/hooks/use-saved-budgets';
import { savedBudgetDetailsRoute } from '@/utils/budget-history';

export default function BudgetsScreen() {
  const { budgets, loading, error, retry } = useSavedBudgets();
  function back() {
    if (router.canGoBack()) router.back();
    else router.replace('/home');
  }
  return <BudgetScreen title="Histórico de orçamentos" subtitle="Consulte os orçamentos salvos neste dispositivo." onBack={back}>
    <BudgetHistoryList budgets={budgets} loading={loading} error={error} onRetry={retry}
      onOpen={(id) => router.push(savedBudgetDetailsRoute(id))} />
  </BudgetScreen>;
}
