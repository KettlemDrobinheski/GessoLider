import { useEffect, useState } from 'react';
import { router, useLocalSearchParams, type Href } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { BudgetButton, BudgetScreen } from '@/components/budget/budget-screen';
import { BudgetCard, BudgetLine } from '@/components/budget/budget-card';
import { savedBudgetsRepository } from '@/services/saved-budgets';
import type { SavedBudget } from '@/types/saved-budget';
import { calculateWallPricing } from '@/domain/calculations/wallPricing';
import { calculateCeilingPricing } from '@/domain/calculations/ceilingPricing';
import { calculateWoodWallCladdingPricing } from '@/domain/calculations/woodWallCladding';
import { formatBRL } from '@/utils/currency';
import { formatBudgetHistoryDate, savedBudgetEditRoute, savedBudgetServiceLabels, savedBudgetStatusLabels } from '@/utils/budget-history';

const measure = (value: number) => `${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} m`;

function pricingSummary(budget: SavedBudget) {
  if (budget.service === 'wall') return calculateWallPricing(budget.budget.measurements, budget.pricing);
  if (budget.service === 'ceiling') return calculateCeilingPricing(budget.budget.measurements, budget.pricing);
  return calculateWoodWallCladdingPricing(budget.budget.measurements, budget.pricing);
}

export default function SavedBudgetDetailsScreen() {
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  const budgetId = typeof id === 'string' ? id : null;
  const [budget, setBudget] = useState<SavedBudget | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [duplicating, setDuplicating] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    if (!budgetId) {
      setError('O identificador do orçamento está ausente.');
      setLoading(false);
      return () => { active = false; };
    }
    void savedBudgetsRepository.getById(budgetId).then((record) => {
      if (!active) return;
      setBudget(record);
      if (!record) setError('Este orçamento não foi encontrado no histórico.');
    }).catch(() => {
      if (active) setError('Não foi possível carregar este orçamento. Tente novamente.');
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [budgetId]);

  function back() {
    if (router.canGoBack()) router.back();
    else router.replace('/orcamentos' as Href);
  }

  function edit() {
    if (!budget) return;
    router.push(savedBudgetEditRoute(budget));
  }

  async function duplicate() {
    if (!budget || duplicating) return;
    setDuplicating(true);
    setActionError(null);
    try {
      const copy = await savedBudgetsRepository.duplicate(budget.id);
      router.push(savedBudgetEditRoute(copy));
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : 'Não foi possível duplicar este orçamento. Tente novamente.');
    } finally {
      setDuplicating(false);
    }
  }

  if (loading) return <BudgetScreen title="Carregando orçamento…" onBack={back} />;
  if (error || !budget) return <BudgetScreen title="Orçamento indisponível" subtitle={error ?? 'Não foi possível ler o registro.'} onBack={back}>
    <BudgetButton label="Voltar ao histórico" onPress={back} />
  </BudgetScreen>;

  const pricing = pricingSummary(budget);
  return <BudgetScreen title={budget.client.name} subtitle={`${savedBudgetServiceLabels[budget.service]} · atualizado em ${formatBudgetHistoryDate(budget.updatedAt)}`} onBack={back}>
    <View style={styles.actions}>
      {!!actionError && <Text accessibilityRole="alert" style={styles.error}>{actionError}</Text>}
      <BudgetButton label="Editar orçamento" onPress={edit} />
      <BudgetButton label={duplicating ? 'Duplicando…' : 'Duplicar orçamento'} disabled={duplicating} onPress={() => { void duplicate(); }} />
    </View>
    <BudgetCard title="Status e valores">
      <BudgetLine label="Status" value={savedBudgetStatusLabels[budget.status]} />
      <BudgetLine label="Valor dos materiais" value={formatBRL(budget.pricing.materialsTotal)} />
      <BudgetLine label="Valor/m² de mão de obra" value={formatBRL(budget.pricing.laborRate)} />
      {pricing && <BudgetLine label="Mão de obra" value={formatBRL(pricing.laborTotal)} />}
      {pricing && <BudgetLine label="Total" value={formatBRL(pricing.total)} />}
      {!!budget.pricing.notes.trim() && <BudgetLine label="Observações" value={budget.pricing.notes} />}
    </BudgetCard>
    <BudgetCard title="Cliente">
      <BudgetLine label="Nome" value={budget.client.name} />
      {!!budget.client.phone && <BudgetLine label="Telefone" value={budget.client.phone} />}
      {!!budget.client.street && <BudgetLine label="Endereço" value={[budget.client.street, budget.client.number].filter(Boolean).join(', ')} />}
      {!!budget.client.neighborhood && <BudgetLine label="Bairro" value={budget.client.neighborhood} />}
      {!!budget.client.city && <BudgetLine label="Cidade" value={[budget.client.city, budget.client.state].filter(Boolean).join(' - ')} />}
      {!!budget.client.cep && <BudgetLine label="CEP" value={budget.client.cep} />}
      {!!budget.client.complement && <BudgetLine label="Complemento" value={budget.client.complement} />}
      {!!budget.client.notes && <BudgetLine label="Observações" value={budget.client.notes} />}
    </BudgetCard>
    <BudgetCard title="Serviço e medidas">
      {budget.service === 'wall' && <>
        <BudgetLine label="Comprimento" value={measure(budget.budget.measurements.length)} />
        <BudgetLine label="Altura" value={measure(budget.budget.measurements.height)} />
        <BudgetLine label="Placa" value={budget.budget.configuration.boardType} />
        <BudgetLine label="Perfil" value={`${budget.budget.configuration.profileWidth} mm`} />
        <BudgetLine label="Espaçamento" value={`${budget.budget.configuration.studSpacingCm} cm`} />
        <BudgetLine label="Lados" value={String(budget.budget.configuration.sides)} />
        <BudgetLine label="Perda" value={`${budget.budget.configuration.wastePercent}%`} />
        <BudgetLine label="Isolamento" value={budget.budget.configuration.insulation ?? 'Não'} />
        <BudgetLine label="Banda acústica" value={budget.budget.configuration.acousticBand ? 'Sim' : 'Não'} />
        {budget.budget.measurements.openings.map((opening) => <BudgetLine key={opening.id} label={opening.type === 'door' ? 'Porta' : 'Janela'}
          value={`${opening.quantity} × ${measure(opening.width)} × ${measure(opening.height)}`} />)}
      </>}
      {budget.service === 'ceiling' && <>
        <BudgetLine label="Comprimento" value={measure(budget.budget.measurements.length)} />
        <BudgetLine label="Largura" value={measure(budget.budget.measurements.width)} />
        <BudgetLine label="Espaçamento" value={`${budget.budget.configuration.spacingCm} cm`} />
        <BudgetLine label="Perda" value={`${budget.budget.configuration.wastePercent}%`} />
      </>}
      {budget.service === 'lining' && <>
        <BudgetLine label="Largura" value={measure(budget.budget.measurements.width)} />
        <BudgetLine label="Altura" value={measure(budget.budget.measurements.height)} />
        <BudgetLine label="Perda" value={`${budget.budget.configuration.wastePercent}%`} />
      </>}
    </BudgetCard>
    <BudgetCard title="Empresa registrada neste orçamento">
      <BudgetLine label="Nome" value={budget.company.companyName} />
      {!!budget.company.responsibleName && <BudgetLine label="Responsável" value={budget.company.responsibleName} />}
      {!!budget.company.phone && <BudgetLine label="Telefone" value={budget.company.phone} />}
      {!!(budget.company.city || budget.company.state) && <BudgetLine label="Localização" value={[budget.company.city, budget.company.state].filter(Boolean).join(' - ')} />}
      {!!budget.company.serviceRegion && <BudgetLine label="Região de atendimento" value={budget.company.serviceRegion} />}
      {!!budget.company.commercialNote && <Text>{budget.company.commercialNote}</Text>}
    </BudgetCard>
  </BudgetScreen>;
}

const styles = StyleSheet.create({
  actions: { gap: 10 },
  error: { color: '#A33232', fontSize: 13, lineHeight: 20 },
});
