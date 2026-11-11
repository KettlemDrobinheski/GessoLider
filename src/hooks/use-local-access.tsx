import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react';

const localAccessKey = 'gessolider:local-access:v1';
type LocalAccessContextValue = {
  active: boolean;
  ready: boolean;
  error: string | null;
  enter: () => Promise<void>;
  exit: () => Promise<void>;
};

const LocalAccessContext = createContext<LocalAccessContextValue | null>(null);

export function LocalAccessProvider({ children }: PropsWithChildren) {
  const [active, setActive] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    AsyncStorage.getItem(localAccessKey).then((value) => {
      if (mounted) setActive(value === 'enabled');
    }).catch(() => {
      if (mounted) setError('Não foi possível verificar o acesso local. Tente novamente.');
    }).finally(() => {
      if (mounted) setReady(true);
    });
    return () => { mounted = false; };
  }, []);

  const enter = useCallback(async () => {
    setError(null);
    try {
      await AsyncStorage.setItem(localAccessKey, 'enabled');
      setActive(true);
    } catch {
      setError('Não foi possível salvar o acesso neste dispositivo. Tente novamente.');
      throw new Error('Falha ao salvar o acesso local.');
    }
  }, []);

  const exit = useCallback(async () => {
    setError(null);
    try {
      await AsyncStorage.removeItem(localAccessKey);
      setActive(false);
    } catch {
      setError('Não foi possível encerrar o acesso local. Tente novamente.');
      throw new Error('Falha ao encerrar o acesso local.');
    }
  }, []);

  const value = useMemo(() => ({ active, ready, error, enter, exit }), [active, ready, error, enter, exit]);
  return <LocalAccessContext.Provider value={value}>{children}</LocalAccessContext.Provider>;
}

export function useLocalAccess() {
  const value = useContext(LocalAccessContext);
  if (!value) throw new Error('useLocalAccess deve ser usado dentro de LocalAccessProvider.');
  return value;
}
