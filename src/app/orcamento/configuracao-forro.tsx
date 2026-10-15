import { useMemo } from 'react';
import { useBudgetClient } from '@/hooks/use-budget-client';
import { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { BudgetButton, BudgetScreen } from '@/components/budget/budget-screen';
import { BudgetCard, BudgetLine } from '@/components/budget/budget-card';
import { ConfigurationOption } from '@/components/budget/configuration-option';
import { ConfigurationSection } from '@/components/budget/configuration-section';
import { ceilingSpacingOptions, ceilingWasteOptions } from '@/constants/ceiling';
import type { CeilingBudgetInput, CeilingConfiguration, CeilingMeasurements } from '@/types/ceiling';
import { parseCeilingBudgetInput, parseCeilingMeasurements } from '@/utils/ceiling';
import { formatArea } from '@/utils/measurements';

export default function CeilingConfigurationScreen() {
  const { clientParams } = useBudgetClient();
  const { forro, orcamento, valores } = useLocalSearchParams<{ forro?: string | string[]; orcamento?: string | string[]; valores?: string | string[] }>();
  const savedBudget = useMemo(() => parseCeilingBudgetInput(orcamento), [orcamento]);
  const measurements = savedBudget?.measurements ?? parseCeilingMeasurements(forro);
  function back() {
    if (router.canGoBack()) router.back();
    else router.replace({ pathname: '/orcamento/medidas', params: { ...clientParams,
      servico: 'ceiling', ...(savedBudget ? { orcamento: JSON.stringify(savedBudget) } : {}),
      ...(typeof valores === 'string' ? { valores } : {}),
    } });
  }
  if (!measurements) return (
    <BudgetScreen title="Configuração do Forro" activeStep={2} onBack={back}>
      <BudgetCard title="Informe as medidas do forro" />
      <BudgetButton label="Voltar às medidas" onPress={back} />
    </BudgetScreen>
  );
  return <CeilingConfigurationForm key={JSON.stringify(savedBudget ?? measurements)} measurements={measurements}
    initialConfiguration={savedBudget?.configuration} onBack={back}
    onContinue={(budget) => router.push({ pathname: '/orcamento/materiais-forro', params: { ...clientParams,
      orcamento: JSON.stringify(budget), ...(typeof valores === 'string' ? { valores } : {}),
    } })} />;
}

function CeilingConfigurationForm({ measurements, initialConfiguration, onBack, onContinue }: {
  measurements: CeilingMeasurements; initialConfiguration?: CeilingConfiguration; onBack: () => void;
  onContinue: (budget: CeilingBudgetInput) => void;
}) {
  const [spacingCm, setSpacingCm] = useState<CeilingConfiguration['spacingCm'] | null>(initialConfiguration?.spacingCm ?? null);
  const [wastePercent, setWastePercent] = useState<CeilingConfiguration['wastePercent'] | null>(initialConfiguration?.wastePercent ?? null);
  function next() {
    if (spacingCm === null || wastePercent === null) return;
    onContinue({ measurements, configuration: { spacingCm, wastePercent } });
  }
  return (
    <BudgetScreen title="Configuração do Forro" subtitle="Escolha o espaçamento da estrutura e a margem de perda." activeStep={2} onBack={onBack}
      footer={<BudgetButton label="Continuar" disabled={spacingCm === null || wastePercent === null} onPress={next} />}>
      <ConfigurationSection title="Espaçamento da estrutura">
        {ceilingSpacingOptions.map((option) => <ConfigurationOption key={option.value} label={option.label}
          selected={spacingCm === option.value} onSelect={() => setSpacingCm(option.value)} />)}
      </ConfigurationSection>
      <ConfigurationSection title="Percentual de perda">
        {ceilingWasteOptions.map((option) => <ConfigurationOption key={option.value} label={option.label}
          selected={wastePercent === option.value} onSelect={() => setWastePercent(option.value)} />)}
      </ConfigurationSection>
      <BudgetCard title="Configuração selecionada">
        <BudgetLine label="Área do forro" value={formatArea(measurements.length * measurements.width)} />
        <BudgetLine label="Espaçamento" value={spacingCm === null ? 'Não selecionado' : `${spacingCm} cm`} />
        <BudgetLine label="Perda" value={wastePercent === null ? 'Não selecionada' : `${wastePercent}%`} />
      </BudgetCard>
    </BudgetScreen>
  );
}
