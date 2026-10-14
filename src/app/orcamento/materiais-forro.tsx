import { router, useLocalSearchParams } from 'expo-router';
import { BudgetButton, BudgetScreen } from '@/components/budget/budget-screen';
import { BudgetCard, BudgetLine } from '@/components/budget/budget-card';
import { CeilingMaterialResults } from '@/components/budget/ceiling-material-results';
import { calculateCeiling } from '@/domain/calculations/ceiling';
import { parseCeilingBudgetInput } from '@/utils/ceiling';
import { formatArea } from '@/utils/measurements';

export default function CeilingMaterialsScreen() {
  const { orcamento, valores } = useLocalSearchParams<{ orcamento?: string | string[]; valores?: string | string[] }>();
  const budget = parseCeilingBudgetInput(orcamento);
  const result = budget ? calculateCeiling({ ...budget.measurements, ...budget.configuration }) : null;
  const params = { ...(budget ? { orcamento: JSON.stringify(budget) } : {}), ...(typeof valores === 'string' ? { valores } : {}) };
  function back() {
    if (router.canGoBack()) router.back();
    else if (budget) router.replace({ pathname: '/orcamento/configuracao-forro', params });
    else router.replace({ pathname: '/orcamento/medidas', params: { servico: 'ceiling' } });
  }
  function next() {
    if (!budget || result?.status !== 'valid') return;
    router.push({ pathname: '/orcamento/valores-forro', params });
  }
  return (
    <BudgetScreen title="Materiais Calculados" subtitle="Confira a estimativa para o forro de drywall." activeStep={3} onBack={back}
      footer={<BudgetButton label="Continuar" disabled={result?.status !== 'valid'} onPress={next} />}>
      {result?.status === 'valid' && <BudgetCard title="Forro de drywall">
        <BudgetLine label="Área do serviço" value={formatArea(result.area)} />
        <BudgetLine label="Perda utilizada" value={`${result.wastePercent}%`} />
        <BudgetLine label="Espaçamento da estrutura" value={`${result.spacingCm} cm`} />
        <BudgetLine label="Área com perda" value={formatArea(result.areaWithWaste)} />
      </BudgetCard>}
      {result ? <CeilingMaterialResults result={result} /> : <BudgetCard title="Revise as medidas e a configuração do forro" />}
      {result?.status !== 'valid' && <BudgetButton label="Voltar e ajustar" onPress={back} />}
    </BudgetScreen>
  );
}
