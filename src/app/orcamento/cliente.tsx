import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import { ClientForm } from '@/components/budget/client-form';
import { BudgetButton, BudgetScreen } from '@/components/budget/budget-screen';
import { useBudgetClient } from '@/hooks/use-budget-client';
import type { ClientData } from '@/types/client';
import { clientRouteKeys, withClient } from '@/utils/client';
import { serviceOptions } from '@/constants/services';

const summaryRoutes = { wall: '/orcamento/resumo', ceiling: '/orcamento/resumo-forro', lining: '/orcamento/resumo-revestimento' } as const;

export default function ClientScreen() {
  const navigation = useNavigation();
  const { servico, orcamento, valores, retorno, orcamentoSalvoId } = useLocalSearchParams<{
    servico?: string | string[]; orcamento?: string | string[]; valores?: string | string[]; retorno?: string | string[]; orcamentoSalvoId?: string | string[];
  }>();
  const { client } = useBudgetClient();
  const service = typeof servico === 'string' ? serviceOptions.find((option) => option.id === servico) : undefined;
  const summary = typeof retorno === 'string' && retorno in summaryRoutes ? summaryRoutes[retorno as keyof typeof summaryRoutes] : null;
  function back() { if (router.canGoBack()) router.back(); else router.replace('/orcamento/tipo-servico'); }
  function next(value: ClientData) {
    if (!service) return;
    const params = withClient({ servico: service.id,
      ...(typeof orcamentoSalvoId === 'string' ? { orcamentoSalvoId } : {}),
      ...(typeof orcamento === 'string' ? { orcamento } : {}), ...(typeof valores === 'string' ? { valores } : {}),
    }, value);
    if (summary) {
      for (const key of clientRouteKeys(navigation.getState()?.routes ?? [])) {
        navigation.dispatch({ type: 'SET_PARAMS', source: key, payload: { params: { cliente: params.cliente } } });
      }
      router.dismissTo({ pathname: summary, params });
    }
    else router.push({ pathname: '/orcamento/medidas', params });
  }
  if (!service) return <BudgetScreen title="Dados do Cliente" activeStep="client" onBack={back}>
    <BudgetButton label="Escolher serviço" onPress={() => router.replace('/orcamento/tipo-servico')} />
  </BudgetScreen>;
  return <ClientForm key={JSON.stringify({ client, servico, orcamento, valores })} initialClient={client} onBack={back} onContinue={next} />;
}
