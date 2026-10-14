import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text } from 'react-native';
import { BudgetButton, BudgetScreen } from '@/components/budget/budget-screen';
import { BudgetCard, BudgetLine } from '@/components/budget/budget-card';
import { CeilingMaterialResults } from '@/components/budget/ceiling-material-results';
import { PricingSummary } from '@/components/budget/pricing-summary';
import { calculateCeiling } from '@/domain/calculations/ceiling';
import { calculateCeilingPricing } from '@/domain/calculations/ceilingPricing';
import { parseCeilingBudgetInput } from '@/utils/ceiling';
import { parseBudgetPricingInput } from '@/utils/budget-pricing';
import { formatArea } from '@/utils/measurements';
import { Brand } from '@/constants/brand';

export default function CeilingSummaryScreen() {
  const { orcamento, valores } = useLocalSearchParams<{ orcamento?: string | string[]; valores?: string | string[] }>();
  const budget = parseCeilingBudgetInput(orcamento);
  const values = parseBudgetPricingInput(valores);
  const materials = budget ? calculateCeiling({ ...budget.measurements, ...budget.configuration }) : null;
  const pricing = budget && values ? calculateCeilingPricing(budget.measurements, values) : null;
  const params = { ...(budget ? { orcamento: JSON.stringify(budget) } : {}), ...(values ? { valores: JSON.stringify(values) } : {}) };
  function editMeasurements() { router.push({ pathname: '/orcamento/medidas', params: { ...params, servico: 'ceiling' } }); }
  function editValues() { router.push({ pathname: '/orcamento/valores-forro', params }); }
  function back() { if (router.canGoBack()) router.back(); else editValues(); }
  if (!budget || !pricing || materials?.status !== 'valid') return (
    <BudgetScreen title="Resumo" activeStep={4} onBack={back}>
      <BudgetCard title="Complete as medidas, a configuração e os valores do forro" />
      <BudgetButton label="Editar medidas/configuração" onPress={editMeasurements} />
      <BudgetButton label="Editar valores" onPress={editValues} />
    </BudgetScreen>
  );
  const measure = (value: number) => `${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} m`;
  return (
    <BudgetScreen title="Resumo do orçamento" subtitle="Confira os dados e valores deste forro." activeStep={4} onBack={back}>
      <BudgetCard title="Serviço"><BudgetLine label="Tipo" value="Forro de drywall" /></BudgetCard>
      <BudgetCard title="Medidas">
        <BudgetLine label="Comprimento" value={measure(budget.measurements.length)} />
        <BudgetLine label="Largura" value={measure(budget.measurements.width)} />
        <BudgetLine label="Área" value={formatArea(materials.area)} />
      </BudgetCard>
      <BudgetCard title="Configuração">
        <BudgetLine label="Espaçamento" value={`${budget.configuration.spacingCm} cm`} />
        <BudgetLine label="Perda" value={`${budget.configuration.wastePercent}%`} />
      </BudgetCard>
      <BudgetCard title="Materiais"><CeilingMaterialResults result={materials} /></BudgetCard>
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
