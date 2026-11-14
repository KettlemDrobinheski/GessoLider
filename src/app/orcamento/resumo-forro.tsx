import { BudgetDocumentPreview } from '@/components/budget/budget-document-preview';
import { CompanySummary } from '@/components/budget/company-summary';
import { useMemo, useState } from 'react';
import { ClientSummary } from '@/components/budget/client-summary';
import { useBudgetClient } from '@/hooks/use-budget-client';
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
import { useCompanyProfile } from '@/hooks/use-company-profile';
import { buildSavedBudgetInput } from '@/utils/budget-history';
import { SaveBudgetAction } from '@/components/budget/save-budget-action';
import { ServiceDescriptionEditor } from '@/components/budget/service-description-editor';

export default function CeilingSummaryScreen() {
  const { profile, loading: companyLoading, loadError: companyError } = useCompanyProfile();
  const { client, clientParams } = useBudgetClient();
  const { orcamento, valores, orcamentoSalvoId } = useLocalSearchParams<{ orcamento?: string | string[]; valores?: string | string[]; orcamentoSalvoId?: string | string[] }>();
  const [serviceDescription, setServiceDescription] = useState('');
  const [serviceDescriptionCustomized, setServiceDescriptionCustomized] = useState(false);
  const budget = useMemo(() => parseCeilingBudgetInput(orcamento), [orcamento]);
  const values = parseBudgetPricingInput(valores);
  const materials = useMemo(() => budget ? calculateCeiling({ ...budget.measurements, ...budget.configuration }) : null, [budget]);
  const pricing = budget && values ? calculateCeilingPricing(budget.measurements, values) : null;
  const params = { ...clientParams, ...(typeof orcamentoSalvoId === 'string' ? { orcamentoSalvoId } : {}), ...(budget ? { orcamento: JSON.stringify(budget) } : {}), ...(values ? { valores: JSON.stringify(values) } : {}) };
  function editMeasurements() { router.push({ pathname: '/orcamento/medidas', params: { ...clientParams, ...params, servico: 'ceiling' } }); }
  function editClient() { router.push({ pathname: '/orcamento/cliente', params: { ...params, servico: 'ceiling', retorno: 'ceiling' } }); }
  function editValues() { router.push({ pathname: '/orcamento/valores-forro', params: { ...params, ...clientParams } }); }
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
      <CompanySummary />
      <ClientSummary client={client} onEdit={editClient} />
      <BudgetCard title="Serviço"><BudgetLine label="Tipo" value="Forro de drywall" /></BudgetCard>
      <ServiceDescriptionEditor service="ceiling" client={client} dimensions={{ length: budget.measurements.length, width: budget.measurements.width }} savedBudgetId={typeof orcamentoSalvoId === 'string' ? orcamentoSalvoId : undefined} value={serviceDescription} onChange={setServiceDescription} onCustomizedChange={setServiceDescriptionCustomized} />
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
      <SaveBudgetAction input={!companyLoading && !companyError ? buildSavedBudgetInput('ceiling', budget, pricing, profile, client, serviceDescription, serviceDescriptionCustomized) : null} serviceDescription={serviceDescription} serviceDescriptionCustomized={serviceDescriptionCustomized}
        unavailableMessage={companyError ? 'Não foi possível carregar os dados da empresa. Tente novamente antes de salvar.' : undefined}
        savedId={typeof orcamentoSalvoId === 'string' ? orcamentoSalvoId : undefined} />
      <BudgetDocumentPreview source={{ service: 'ceiling', budget, materials, pricing }} client={client} savedBudgetId={typeof orcamentoSalvoId === 'string' ? orcamentoSalvoId : undefined} serviceDescription={serviceDescription} />
    </BudgetScreen>
  );
}

const styles = StyleSheet.create({ text: { color: Brand.dark, fontSize: 14, lineHeight: 22 } });
