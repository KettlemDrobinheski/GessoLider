import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import type { SavedBudget } from '@/types/saved-budget';
import { savedBudgetsRepository } from '@/services/saved-budgets';

export function useSavedBudgets() {
  const [budgets, setBudgets] = useState<SavedBudget[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useFocusEffect(useCallback(() => {
    let active = true;
    setLoading(true);
    setError(null);
    void savedBudgetsRepository.list().then((items) => {
      if (active) setBudgets(items);
    }).catch(() => {
      if (active) {
        setBudgets([]);
        setError('Não foi possível carregar o histórico. Tente novamente.');
      }
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [reloadKey]));

  const retry = useCallback(() => setReloadKey((value) => value + 1), []);
  return { budgets, loading, error, retry };
}
