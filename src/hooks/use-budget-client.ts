import { useMemo } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { parseClientData } from '@/utils/client';

export function useBudgetClient() {
  const { cliente } = useLocalSearchParams<{ cliente?: string | string[] }>();
  const client = useMemo(() => parseClientData(cliente), [cliente]);
  const clientParams = client ? { cliente: JSON.stringify(client) } : {};
  return { client, clientParams };
}
