import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { parseClientData, resolveBudgetClient } from '@/utils/client';
import type { ClientData } from '@/types/client';
import { useBudgetDraft } from '@/hooks/use-budget-draft';

const budgetClientKey = 'gessolider:budget-client:v1';
type BudgetClientContextValue = { client: ClientData | null; setClient: (client: ClientData) => Promise<void>; setClientMemory: (client: ClientData) => void };
const BudgetClientContext = createContext<BudgetClientContextValue | null>(null);

export function BudgetClientProvider({ children }: PropsWithChildren) {
  const [client, setStoredClient] = useState<ClientData | null>(null);
  useEffect(() => {
    let mounted = true;
    AsyncStorage.getItem(budgetClientKey).then((serialized) => {
      if (mounted) setStoredClient(parseClientData(serialized ?? undefined));
    }).catch(() => undefined);
    return () => { mounted = false; };
  }, []);

  const setClient = useCallback(async (value: ClientData) => {
    const serialized = JSON.stringify(value);
    await AsyncStorage.setItem(budgetClientKey, serialized);
    setStoredClient(value);
  }, []);
  const setClientMemory = useCallback((value: ClientData) => setStoredClient(value), []);
  const value = useMemo(() => ({ client, setClient, setClientMemory }), [client, setClient, setClientMemory]);
  return <BudgetClientContext.Provider value={value}>{children}</BudgetClientContext.Provider>;
}

export function useBudgetClient() {
  const context = useContext(BudgetClientContext);
  if (!context) throw new Error('useBudgetClient deve ser usado dentro de BudgetClientProvider.');
  const { cliente, orcamentoSalvoId } = useLocalSearchParams<{ cliente?: string | string[]; orcamentoSalvoId?: string | string[] }>();
  const legacyClient = useMemo(() => parseClientData(cliente), [cliente]);
  const { draft } = useBudgetDraft();
  const draftClient = draft?.formData.clientDraft;
  const client = resolveBudgetClient(context.client, draftClient, legacyClient, typeof orcamentoSalvoId === 'string');
  return { client, setClient: context.setClient, setClientMemory: context.setClientMemory, clientParams: {} };
}
