import { router, useLocalSearchParams } from 'expo-router';
import { BudgetValuesForm } from '@/components/budget/budget-values-form';
import { BudgetButton, BudgetScreen } from '@/components/budget/budget-screen';
import { BudgetCard } from '@/components/budget/budget-card';
import { calculateWoodWallCladding, calculateWoodWallCladdingPricing } from '@/domain/calculations/woodWallCladding';
import { parseWoodWallCladdingBudgetInput } from '@/utils/wood-wall-cladding';
import { parseBudgetPricingInput } from '@/utils/budget-pricing';

export default function WoodWallCladdingValuesScreen() {
  const { orcamento, valores } = useLocalSearchParams<{ orcamento?: string | string[]; valores?: string | string[] }>();
  const budget = parseWoodWallCladdingBudgetInput(orcamento);
  const initialValues = parseBudgetPricingInput(valores);
  const result = budget ? calculateWoodWallCladding({ ...budget.measurements, ...budget.configuration }) : null;
  const params = { ...(budget ? { orcamento: JSON.stringify(budget) } : {}), ...(initialValues ? { valores: JSON.stringify(initialValues) } : {}) };
  function back() {
    if (router.canGoBack()) router.back();
    else if (budget) router.replace({ pathname: '/orcamento/materiais-revestimento', params });
    else router.replace({ pathname: '/orcamento/medidas', params: { servico: 'lining' } });
  }
  if (!budget || result?.status !== 'valid') return (
    <BudgetScreen title="Valores" activeStep={3} onBack={back}>
      <BudgetCard title="Informe as medidas e a configuração do revestimento" />
      <BudgetButton label="Voltar e ajustar" onPress={back} />
    </BudgetScreen>
  );
  return <BudgetValuesForm key={JSON.stringify({ budget, initialValues })} billingArea={result.area} initialValues={initialValues} onBack={back}
    areaNote="A cobrança utiliza a área do revestimento, sem aplicar a margem de perda."
    calculatePricing={(values) => calculateWoodWallCladdingPricing(budget.measurements, values)}
    onContinue={(values) => router.push({ pathname: '/orcamento/resumo-revestimento', params: {
      orcamento: JSON.stringify(budget), valores: JSON.stringify(values),
    } })} />;
}
