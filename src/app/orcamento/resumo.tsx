import { BudgetDocumentPreview } from '@/components/budget/budget-document-preview';
import { CompanySummary } from '@/components/budget/company-summary';
import { useMemo } from 'react';
import { ClientSummary } from '@/components/budget/client-summary';
import { useBudgetClient } from '@/hooks/use-budget-client';
import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { BudgetButton, BudgetScreen } from '@/components/budget/budget-screen';
import { BudgetCard, BudgetLine } from '@/components/budget/budget-card';
import { PricingSummary } from '@/components/budget/pricing-summary';
import { WallConfigurationSummary } from '@/components/budget/wall-configuration-summary';
import { WallMaterialResults } from '@/components/budget/wall-material-results';
import { Brand } from '@/constants/brand';
import { calculateWallMaterials } from '@/domain/calculations/wallMaterials';
import { calculateWallPricing } from '@/domain/calculations/wallPricing';
import { formatArea } from '@/utils/measurements';
import { parseWallBudgetInput } from '@/utils/wall-configuration';
import { parseWallPricingInput } from '@/utils/wall-pricing';

export default function SummaryScreen() {
  const { client, clientParams } = useBudgetClient();
  const { orcamento, valores } = useLocalSearchParams<{ orcamento?: string | string[]; valores?: string | string[] }>();
  const budget = useMemo(() => parseWallBudgetInput(orcamento), [orcamento]);
  const values = parseWallPricingInput(valores);
  const materials = useMemo(() => budget ? calculateWallMaterials({ ...budget.measurements, ...budget.configuration }) : null, [budget]);
  const pricing = budget && values && materials?.status === 'valid' ? calculateWallPricing(budget.measurements, values) : null;
  const params = { ...clientParams,
    ...(budget ? { orcamento: JSON.stringify(budget) } : {}),
    ...(values ? { valores: JSON.stringify(values) } : {}),
  };

  function editClient() { router.push({ pathname: '/orcamento/cliente', params: { ...params, servico: 'wall', retorno: 'wall' } }); }
  function editValues() {
    router.push({ pathname: '/orcamento/valores', params: { ...params, ...clientParams } });
  }

  function editMeasurements() {
    router.push({ pathname: '/orcamento/medidas', params: { ...clientParams, ...params, servico: 'wall' } });
  }

  function handleBack() {
    if (router.canGoBack()) router.back();
    else editValues();
  }

  function formatMeasure(value: number) {
    return `${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} m`;
  }

  if (!budget || !pricing || materials?.status !== 'valid') {
    return (
      <BudgetScreen title="Resumo" activeStep={4} onBack={handleBack}>
        {materials && materials.status !== 'valid' ? <WallMaterialResults result={materials} /> : (
          <BudgetCard title="Revise o orçamento"><Text style={styles.text}>Complete as medidas, a configuração e os valores para visualizar o resumo.</Text></BudgetCard>
        )}
        <BudgetButton label="Editar medidas/configuração" onPress={editMeasurements} />
        <BudgetButton label="Editar valores" onPress={editValues} />
      </BudgetScreen>
    );
  }

  const configuration = budget.configuration;
  return (
    <BudgetScreen title="Resumo do orçamento" subtitle="Confira os dados e valores desta parede." activeStep={4} onBack={handleBack}>
      <CompanySummary />
      <ClientSummary client={client} onEdit={editClient} />
      <BudgetCard title="Serviço">
        <BudgetLine label="Tipo" value="Parede" />
      </BudgetCard>
      <BudgetCard title="Medidas">
        <BudgetLine label="Comprimento" value={formatMeasure(budget.measurements.length)} />
        <BudgetLine label="Altura" value={formatMeasure(budget.measurements.height)} />
        <BudgetLine label="Área" value={formatArea(materials.wallArea)} />
      </BudgetCard>
      <WallConfigurationSummary draft={{
        boardType: configuration.boardType, profileWidth: configuration.profileWidth, studSpacingCm: configuration.studSpacingCm,
        sides: configuration.sides, wastePercent: configuration.wastePercent,
        hasInsulation: configuration.insulation !== null, insulationType: configuration.insulation,
        acousticBand: configuration.acousticBand,
      }} />
      <BudgetCard title="Materiais"><WallMaterialResults result={materials} /></BudgetCard>
      <PricingSummary pricing={pricing} />
      {!!pricing.notes.trim() && <BudgetCard title="Observações"><Text style={styles.text}>{pricing.notes}</Text></BudgetCard>}
      <View style={styles.actions}>
        <BudgetButton label="Editar medidas/configuração" onPress={editMeasurements} />
        <BudgetButton label="Editar valores" onPress={editValues} />
      </View>
      <BudgetDocumentPreview source={{ service: 'wall', budget, materials, pricing }} client={client} />
    </BudgetScreen>
  );
}

const styles = StyleSheet.create({
  text: { color: Brand.dark, fontSize: 14, lineHeight: 22 },
  note: { color: '#60706A', fontSize: 13, lineHeight: 20 },
  actions: { gap: 12 },
});
