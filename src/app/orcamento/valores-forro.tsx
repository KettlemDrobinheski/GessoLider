import { useMemo } from 'react';
import { useBudgetClient } from '@/hooks/use-budget-client';
import { router, useLocalSearchParams } from 'expo-router';
import { BudgetValuesForm } from '@/components/budget/budget-values-form';
import { BudgetButton, BudgetScreen } from '@/components/budget/budget-screen';
import { BudgetCard } from '@/components/budget/budget-card';
import { calculateCeiling } from '@/domain/calculations/ceiling';
import { calculateCeilingPricing } from '@/domain/calculations/ceilingPricing';
import { parseCeilingBudgetInput } from '@/utils/ceiling';
import { parseBudgetPricingInput } from '@/utils/budget-pricing';

export default function CeilingValuesScreen() {
  const { clientParams } = useBudgetClient();
  const { orcamento, valores, orcamentoSalvoId } = useLocalSearchParams<{ orcamento?: string | string[]; valores?: string | string[]; orcamentoSalvoId?: string | string[] }>();
  const budget = useMemo(() => parseCeilingBudgetInput(orcamento), [orcamento]);
  const initialValues = parseBudgetPricingInput(valores);
  const result = useMemo(() => budget ? calculateCeiling({ ...budget.measurements, ...budget.configuration }) : null, [budget]);
  const params = { ...(budget ? { orcamento: JSON.stringify(budget) } : {}), ...(initialValues ? { valores: JSON.stringify(initialValues) } : {}) };
  function back() {
    if (router.canGoBack()) router.back();
    else if (budget) router.replace({ pathname: '/orcamento/materiais-forro', params: { ...params, ...clientParams } });
    else router.replace({ pathname: '/orcamento/medidas', params: { ...clientParams, servico: 'ceiling' } });
  }
  if (!budget || result?.status !== 'valid') return (
    <BudgetScreen title="Valores" activeStep={3} onBack={back}>
      <BudgetCard title="Informe as medidas e a configuração do forro" />
      <BudgetButton label="Voltar e ajustar" onPress={back} />
    </BudgetScreen>
  );
  return <BudgetValuesForm key={JSON.stringify({ budget, initialValues })} billingArea={result.area} initialValues={initialValues} onBack={back}
    areaNote="A cobrança utiliza a área do forro, sem aplicar a margem de perda."
    calculatePricing={(values) => calculateCeilingPricing(budget.measurements, values)}
    onContinue={(values) => router.push({ pathname: '/orcamento/resumo-forro', params: { ...clientParams,
      ...(typeof orcamentoSalvoId === 'string' ? { orcamentoSalvoId } : {}),
      orcamento: JSON.stringify(budget), valores: JSON.stringify(values),
    } })} />;
}
