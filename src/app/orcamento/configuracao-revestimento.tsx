import { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { BudgetButton, BudgetScreen } from '@/components/budget/budget-screen';
import { BudgetCard, BudgetLine } from '@/components/budget/budget-card';
import { ConfigurationOption } from '@/components/budget/configuration-option';
import { ConfigurationSection } from '@/components/budget/configuration-section';
import { wasteOptions } from '@/constants/wall-configuration';
import type { WoodWallCladdingBudgetInput, WoodWallCladdingConfiguration, WoodWallCladdingMeasurements } from '@/types/wood-wall-cladding';
import { parseWoodWallCladdingBudgetInput, parseWoodWallCladdingMeasurements } from '@/utils/wood-wall-cladding';
import { formatArea } from '@/utils/measurements';

export default function WoodWallCladdingConfigurationScreen() {
  const { revestimento, orcamento, valores } = useLocalSearchParams<{ revestimento?: string | string[]; orcamento?: string | string[]; valores?: string | string[] }>();
  const savedBudget = parseWoodWallCladdingBudgetInput(orcamento);
  const measurements = savedBudget?.measurements ?? parseWoodWallCladdingMeasurements(revestimento);
  function back() {
    if (router.canGoBack()) router.back();
    else router.replace({ pathname: '/orcamento/medidas', params: {
      servico: 'lining', ...(savedBudget ? { orcamento: JSON.stringify(savedBudget) } : {}),
      ...(typeof valores === 'string' ? { valores } : {}),
    } });
  }
  if (!measurements) return (
    <BudgetScreen title="Configuração do Revestimento" activeStep={2} onBack={back}>
      <BudgetCard title="Informe as medidas do revestimento" />
      <BudgetButton label="Voltar às medidas" onPress={back} />
    </BudgetScreen>
  );
  return <WoodWallCladdingConfigurationForm key={JSON.stringify(savedBudget ?? measurements)} measurements={measurements}
    initialConfiguration={savedBudget?.configuration} onBack={back}
    onContinue={(budget) => router.push({ pathname: '/orcamento/materiais-revestimento', params: {
      orcamento: JSON.stringify(budget), ...(typeof valores === 'string' ? { valores } : {}),
    } })} />;
}

function WoodWallCladdingConfigurationForm({ measurements, initialConfiguration, onBack, onContinue }: {
  measurements: WoodWallCladdingMeasurements; initialConfiguration?: WoodWallCladdingConfiguration; onBack: () => void;
  onContinue: (budget: WoodWallCladdingBudgetInput) => void;
}) {
  const [wastePercent, setWastePercent] = useState<WoodWallCladdingConfiguration['wastePercent'] | null>(initialConfiguration?.wastePercent ?? null);
  function next() {
    if (wastePercent === null) return;
    onContinue({ measurements, configuration: { wastePercent } });
  }
  return (
    <BudgetScreen title="Configuração do Revestimento" subtitle="Escolha a margem de perda dos materiais." activeStep={2} onBack={onBack}
      footer={<BudgetButton label="Continuar" disabled={wastePercent === null} onPress={next} />}>
      <ConfigurationSection title="Percentual de perda">
        {wasteOptions.map((option) => <ConfigurationOption key={option.value} label={option.label}
          selected={wastePercent === option.value} onSelect={() => setWastePercent(option.value)} />)}
      </ConfigurationSection>
      <BudgetCard title="Configuração selecionada">
        <BudgetLine label="Área do revestimento" value={formatArea(measurements.width * measurements.height)} />
        <BudgetLine label="Perda" value={wastePercent === null ? 'Não selecionada' : `${wastePercent}%`} />
      </BudgetCard>
    </BudgetScreen>
  );
}
