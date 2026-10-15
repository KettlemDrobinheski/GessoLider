import { useMemo } from 'react';
import { useBudgetClient } from '@/hooks/use-budget-client';
import { router, useLocalSearchParams } from 'expo-router';
import { BudgetButton, BudgetScreen } from '@/components/budget/budget-screen';
import { BudgetCard, BudgetLine } from '@/components/budget/budget-card';
import { WoodWallCladdingMaterialResults } from '@/components/budget/wood-wall-cladding-material-results';
import { calculateWoodWallCladding } from '@/domain/calculations/woodWallCladding';
import { parseWoodWallCladdingBudgetInput } from '@/utils/wood-wall-cladding';
import { formatArea } from '@/utils/measurements';

export default function WoodWallCladdingMaterialsScreen() {
  const { clientParams } = useBudgetClient();
  const { orcamento, valores } = useLocalSearchParams<{ orcamento?: string | string[]; valores?: string | string[] }>();
  const budget = useMemo(() => parseWoodWallCladdingBudgetInput(orcamento), [orcamento]);
  const result = useMemo(() => budget ? calculateWoodWallCladding({ ...budget.measurements, ...budget.configuration }) : null, [budget]);
  const params = { ...(budget ? { orcamento: JSON.stringify(budget) } : {}), ...(typeof valores === 'string' ? { valores } : {}) };
  function back() {
    if (router.canGoBack()) router.back();
    else if (budget) router.replace({ pathname: '/orcamento/configuracao-revestimento', params: { ...params, ...clientParams } });
    else router.replace({ pathname: '/orcamento/medidas', params: { ...clientParams, servico: 'lining' } });
  }
  function next() {
    if (!budget || result?.status !== 'valid') return;
    router.push({ pathname: '/orcamento/valores-revestimento', params: { ...params, ...clientParams } });
  }
  return (
    <BudgetScreen title="Materiais Calculados" subtitle="Confira os materiais para fixar as placas diretamente na madeira." activeStep={3} onBack={back}
      footer={<BudgetButton label="Continuar" disabled={result?.status !== 'valid'} onPress={next} />}>
      {result?.status === 'valid' && <BudgetCard title="Revestimento em parede de madeira">
        <BudgetLine label="Área do serviço" value={formatArea(result.area)} />
        <BudgetLine label="Perda utilizada" value={`${result.wastePercent}%`} />
        <BudgetLine label="Área com perda" value={formatArea(result.areaWithWaste)} />
      </BudgetCard>}
      {result ? <WoodWallCladdingMaterialResults result={result} /> : <BudgetCard title="Revise as medidas e a configuração do revestimento" />}
      {result?.status !== 'valid' && <BudgetButton label="Voltar e ajustar" onPress={back} />}
    </BudgetScreen>
  );
}
