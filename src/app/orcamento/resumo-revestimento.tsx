import { CompanySummary } from '@/components/budget/company-summary';
import { useMemo } from 'react';
import { ClientSummary } from '@/components/budget/client-summary';
import { useBudgetClient } from '@/hooks/use-budget-client';
import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text } from 'react-native';
import { BudgetButton, BudgetScreen } from '@/components/budget/budget-screen';
import { BudgetCard, BudgetLine } from '@/components/budget/budget-card';
import { WoodWallCladdingMaterialResults } from '@/components/budget/wood-wall-cladding-material-results';
import { PricingSummary } from '@/components/budget/pricing-summary';
import { calculateWoodWallCladding, calculateWoodWallCladdingPricing } from '@/domain/calculations/woodWallCladding';
import { parseWoodWallCladdingBudgetInput } from '@/utils/wood-wall-cladding';
import { parseBudgetPricingInput } from '@/utils/budget-pricing';
import { formatArea } from '@/utils/measurements';
import { Brand } from '@/constants/brand';

export default function WoodWallCladdingSummaryScreen() {
  const { client, clientParams } = useBudgetClient();
  const { orcamento, valores } = useLocalSearchParams<{ orcamento?: string | string[]; valores?: string | string[] }>();
  const budget = useMemo(() => parseWoodWallCladdingBudgetInput(orcamento), [orcamento]);
  const values = parseBudgetPricingInput(valores);
  const materials = useMemo(() => budget ? calculateWoodWallCladding({ ...budget.measurements, ...budget.configuration }) : null, [budget]);
  const pricing = budget && values ? calculateWoodWallCladdingPricing(budget.measurements, values) : null;
  const params = { ...clientParams, ...(budget ? { orcamento: JSON.stringify(budget) } : {}), ...(values ? { valores: JSON.stringify(values) } : {}) };
  function editMeasurements() { router.push({ pathname: '/orcamento/medidas', params: { ...clientParams, ...params, servico: 'lining' } }); }
  function editClient() { router.push({ pathname: '/orcamento/cliente', params: { ...params, servico: 'lining', retorno: 'lining' } }); }
  function editValues() { router.push({ pathname: '/orcamento/valores-revestimento', params: { ...params, ...clientParams } }); }
  function back() { if (router.canGoBack()) router.back(); else editValues(); }
  if (!budget || !pricing || materials?.status !== 'valid') return (
    <BudgetScreen title="Resumo" activeStep={4} onBack={back}>
      <BudgetCard title="Complete as medidas, a configuração e os valores do revestimento" />
      <BudgetButton label="Editar medidas/configuração" onPress={editMeasurements} />
      <BudgetButton label="Editar valores" onPress={editValues} />
    </BudgetScreen>
  );
  const measure = (value: number) => `${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} m`;
  return (
    <BudgetScreen title="Resumo do orçamento" subtitle="Confira os dados e valores deste revestimento." activeStep={4} onBack={back}>
      <CompanySummary />
      <ClientSummary client={client} onEdit={editClient} />
      <BudgetCard title="Serviço"><BudgetLine label="Tipo" value="Revestimento em parede de madeira" /></BudgetCard>
      <BudgetCard title="Medidas">
        <BudgetLine label="Largura" value={measure(budget.measurements.width)} />
        <BudgetLine label="Altura" value={measure(budget.measurements.height)} />
        <BudgetLine label="Área" value={formatArea(materials.area)} />
      </BudgetCard>
      <BudgetCard title="Configuração">
        <BudgetLine label="Perda" value={`${budget.configuration.wastePercent}%`} />
      </BudgetCard>
      <BudgetCard title="Materiais"><WoodWallCladdingMaterialResults result={materials} /></BudgetCard>
      <PricingSummary pricing={pricing} />
      {!!pricing.notes.trim() && <BudgetCard title="Observações"><Text style={styles.text}>{pricing.notes}</Text></BudgetCard>}
      <BudgetButton label="Editar medidas/configuração" onPress={editMeasurements} />
      <BudgetButton label="Editar valores" onPress={editValues} />
      <Text style={styles.text}>A geração do documento será disponibilizada na próxima etapa.</Text>
      <BudgetButton label="Gerar orçamento" disabled />
    </BudgetScreen>
  );
}

const styles = StyleSheet.create({ text: { color: Brand.dark, fontSize: 14, lineHeight: 22 } });
