import { router, useGlobalSearchParams, useLocalSearchParams, usePathname } from 'expo-router';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type PropsWithChildren } from 'react';
import { savedBudgetsRepository, type BudgetDraft } from '@/services/saved-budgets';
import { Text } from 'react-native';

type DraftStatus = 'loading' | 'saved' | 'saving' | 'error' | 'empty';
type DraftContextValue = {
  draft: BudgetDraft | null;
  status: DraftStatus;
  error: string | null;
  saveFields: (fields: Record<string, unknown>, service?: BudgetDraft['service']) => Promise<void>;
  discard: () => Promise<void>;
  complete: () => Promise<void>;
  resume: () => void;
};

const BudgetDraftContext = createContext<DraftContextValue | null>(null);

function routeParams(params: Record<string, string | string[] | undefined>) {
  return Object.fromEntries(Object.entries(params).filter(([key, value]) => key !== 'cliente' && typeof value === 'string')) as Record<string, string>;
}

function routeService(params: Record<string, string>) {
  if (params.servico === 'wall' || params.servico === 'ceiling' || params.servico === 'lining') return params.servico;
  return undefined;
}

export function BudgetDraftProvider({ children }: PropsWithChildren) {
  const pathname = usePathname();
  const searchParams = useGlobalSearchParams<Record<string, string | string[]>>();
  const [draft, setDraft] = useState<BudgetDraft | null>(null);
  const [status, setStatus] = useState<DraftStatus>('loading');
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const suppressed = useRef(false);
  const writeQueue = useRef(Promise.resolve());
  const paramsKey = JSON.stringify(routeParams(searchParams));

  useEffect(() => {
    let active = true;
    savedBudgetsRepository.getDraft().then((value) => {
      if (!active) return;
      setDraft(value);
      setStatus(value ? 'saved' : 'empty');
    }).catch(() => {
      if (!active) return;
      setStatus('error');
      setError('Não foi possível carregar o rascunho salvo.');
    }).finally(() => { if (active) setLoaded(true); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!loaded || !pathname.startsWith('/orcamento/') || pathname === '/orcamento/tipo-servico' && suppressed.current) return;
    const params = JSON.parse(paramsKey) as Record<string, string>;
    if (params.orcamentoSalvoId) return;
    if (suppressed.current) suppressed.current = false;
    setStatus((current) => current === 'error' ? current : 'saving');
    const operation = writeQueue.current.catch(() => undefined).then(async () => {
      const stored = await savedBudgetsRepository.saveDraft({ route: pathname, params, service: routeService(params) });
      setDraft(stored);
      setStatus('saved');
      setError(null);
    });
    writeQueue.current = operation;
    void operation.catch(() => {
      setStatus('error');
      setError('Não foi possível salvar o rascunho. Verifique o armazenamento e tente novamente.');
    });
  }, [loaded, pathname, paramsKey]);

  const saveFields = useCallback(async (fields: Record<string, unknown>, service?: BudgetDraft['service']) => {
    if (!loaded || !pathname.startsWith('/orcamento/')) return;
    const params = JSON.parse(paramsKey) as Record<string, string>;
    if (params.orcamentoSalvoId) return;
    setStatus('saving');
    const operation = writeQueue.current.catch(() => undefined).then(async () => {
      const stored = await savedBudgetsRepository.saveDraft({ route: pathname, params, service: service ?? routeService(params), formData: fields });
      setDraft(stored);
      setStatus('saved');
      setError(null);
    });
    writeQueue.current = operation;
    try { await operation; }
    catch {
      setStatus('error');
      setError('Não foi possível salvar as alterações do rascunho. Tente novamente.');
      throw new Error('Falha ao salvar rascunho.');
    }
  }, [loaded, pathname, paramsKey]);

  const discard = useCallback(async () => {
    await writeQueue.current.catch(() => undefined);
    const removed = await savedBudgetsRepository.discardDraft(draft?.id);
    if (removed) {
      setDraft(null);
      setStatus('empty');
      setError(null);
      suppressed.current = true;
    }
  }, [draft?.id]);

  const complete = useCallback(async () => {
    await writeQueue.current.catch(() => undefined);
    await savedBudgetsRepository.clearDraft();
    setDraft(null);
    setStatus('empty');
    setError(null);
    suppressed.current = true;
  }, []);

  const resume = useCallback(() => {
    if (!draft) return;
    const params = { ...draft.params };
    delete params.cliente;
    router.push({ pathname: draft.route as never, params });
  }, [draft]);

  const value = useMemo(() => ({ draft, status, error, saveFields, discard, complete, resume }),
    [draft, status, error, saveFields, discard, complete, resume]);
  return <BudgetDraftContext.Provider value={value}>{children}</BudgetDraftContext.Provider>;
}

export function useBudgetDraft() {
  const context = useContext(BudgetDraftContext);
  if (!context) throw new Error('useBudgetDraft deve ser usado dentro de BudgetDraftProvider.');
  return context;
}

export function DraftSaveStatus() {
  const { status, error } = useBudgetDraft();
  const { orcamentoSalvoId } = useLocalSearchParams<{ orcamentoSalvoId?: string | string[] }>();
  if (typeof orcamentoSalvoId === 'string') return null;
  if (status === 'loading' || status === 'empty') return null;
  return <TextStatus status={status} error={error} />;
}

function TextStatus({ status, error }: { status: DraftStatus; error: string | null }) {
  const label = status === 'saving' ? 'Salvando rascunho…' : status === 'error' ? error ?? 'Falha ao salvar rascunho.' : 'Rascunho salvo neste dispositivo.';
  return <StatusText label={label} failed={status === 'error'} />;
}

function StatusText({ label, failed }: { label: string; failed: boolean }) {
  const color = failed ? '#A33232' : '#60706A';
  return <Text accessibilityRole={failed ? 'alert' : 'text'} style={{ color, fontSize: 13, lineHeight: 20 }}>{label}</Text>;
}
