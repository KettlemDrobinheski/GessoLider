import { router, useLocalSearchParams } from 'expo-router';
import { ClientForm } from '@/components/budget/client-form';
import { BudgetButton, BudgetScreen } from '@/components/budget/budget-screen';
import { useBudgetClient } from '@/hooks/use-budget-client';
import type { ClientData } from '@/types/client';
import { serviceOptions } from '@/constants/services';
import { useBudgetDraft } from '@/hooks/use-budget-draft';

const summaryRoutes = { wall: '/orcamento/resumo', ceiling: '/orcamento/resumo-forro', lining: '/orcamento/resumo-revestimento' } as const;

export default function ClientScreen() {
  const { servico, orcamento, valores, retorno, orcamentoSalvoId } = useLocalSearchParams<{
    servico?: string | string[]; orcamento?: string | string[]; valores?: string | string[]; retorno?: string | string[]; orcamentoSalvoId?: string | string[];
  }>();
  const { client, setClient, setClientMemory } = useBudgetClient();
  const { draft, saveFields } = useBudgetDraft();
  const service = typeof servico === 'string' ? serviceOptions.find((option) => option.id === servico) : undefined;
  const summary = typeof retorno === 'string' && retorno in summaryRoutes ? summaryRoutes[retorno as keyof typeof summaryRoutes] : null;
  function back() { if (router.canGoBack()) router.back(); else router.replace('/orcamento/tipo-servico'); }
  async function next(value: ClientData) {
    if (!service) return;
    await setClient(value);
    await saveFields({ clientDraft: value }, service.id === 'wall' || service.id === 'ceiling' || service.id === 'lining' ? service.id : null);
    const params = { servico: service.id,
      ...(typeof orcamentoSalvoId === 'string' ? { orcamentoSalvoId } : {}),
      ...(typeof orcamento === 'string' ? { orcamento } : {}), ...(typeof valores === 'string' ? { valores } : {}),
    };
    if (summary) {
      router.dismissTo({ pathname: summary, params });
    }
    else router.push({ pathname: '/orcamento/medidas', params });
  }
  if (!service) return <BudgetScreen title="Dados do Cliente" activeStep="client" onBack={back}>
    <BudgetButton label="Escolher serviço" onPress={() => router.replace('/orcamento/tipo-servico')} />
  </BudgetScreen>;
  const recoveredClient = typeof orcamentoSalvoId !== 'string' && draft?.service === service.id
    ? draft.formData.clientDraft as ClientData | undefined
    : undefined;
  return <ClientForm key={JSON.stringify({ servico, orcamento, valores, orcamentoSalvoId })}
    initialClient={recoveredClient ?? client} onBack={back} onContinue={next}
    onDraftChange={(value) => {
      setClientMemory(value);
      void saveFields({ clientDraft: value }, service?.id === 'wall' || service?.id === 'ceiling' || service?.id === 'lining' ? service.id : null).catch(() => undefined);
    }} />;
}
