import { useEffect, useState } from 'react';
import { router, useLocalSearchParams, type Href } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { BudgetButton, BudgetScreen } from '@/components/budget/budget-screen';
import { BudgetCard, BudgetLine } from '@/components/budget/budget-card';
import { SavedBudgetDocumentActions } from '@/components/budget/saved-budget-document-actions';
import { LoadingMessage } from '@/components/ui/loading-message';
import { savedBudgetsRepository } from '@/services/saved-budgets';
import type { BudgetStatus, SavedBudget } from '@/types/saved-budget';
import { calculateWallPricing } from '@/domain/calculations/wallPricing';
import { calculateCeilingPricing } from '@/domain/calculations/ceilingPricing';
import { calculateWoodWallCladdingPricing } from '@/domain/calculations/woodWallCladding';
import { formatBRL } from '@/utils/currency';
import { formatBudgetHistoryDate, savedBudgetEditRoute, savedBudgetServiceLabels, savedBudgetStatusLabels } from '@/utils/budget-history';
import { useBudgetClient } from '@/hooks/use-budget-client';

const measure = (value: number) => `${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} m`;
const budgetStatuses: BudgetStatus[] = ['draft', 'sent', 'approved', 'rejected', 'completed'];

function pricingSummary(budget: SavedBudget) {
  if (budget.service === 'wall') return calculateWallPricing(budget.budget.measurements, budget.pricing);
  if (budget.service === 'ceiling') return calculateCeilingPricing(budget.budget.measurements, budget.pricing);
  return calculateWoodWallCladdingPricing(budget.budget.measurements, budget.pricing);
}

export default function SavedBudgetDetailsScreen() {
  const { setClient } = useBudgetClient();
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  const budgetId = typeof id === 'string' ? id : null;
  const [budget, setBudget] = useState<SavedBudget | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [duplicating, setDuplicating] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

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
  }, [budgetId, loadAttempt]);

  function back() {
    if (router.canGoBack()) router.back();
    else router.replace('/orcamentos' as Href);
  }

  async function edit() {
    if (!budget) return;
    try {
      await setClient(budget.client);
      router.push(savedBudgetEditRoute(budget));
    } catch {
      setActionError('Não foi possível preparar os dados do cliente para edição. Tente novamente.');
    }
  }

  async function updateStatus(status: BudgetStatus) {
    if (!budget || status === budget.status || updatingStatus || deleting || duplicating) return;
    setUpdatingStatus(true);
    setActionError(null);
    setActionFeedback(null);
    try {
      const updated = await savedBudgetsRepository.update(budget.id, { status });
      setBudget(updated);
      setActionFeedback(`Status atualizado para ${savedBudgetStatusLabels[updated.status]}.`);
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : 'Não foi possível atualizar o status. Tente novamente.');
    } finally {
      setUpdatingStatus(false);
    }
  }

  async function duplicate() {
    if (!budget || duplicating) return;
    setDuplicating(true);
    setActionError(null);
    setActionFeedback(null);
    try {
      await setClient(budget.client);
      const copy = await savedBudgetsRepository.duplicate(budget.id);
      router.push(savedBudgetEditRoute(copy));
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : 'Não foi possível duplicar este orçamento. Tente novamente.');
    } finally {
      setDuplicating(false);
    }
  }

  async function deleteBudget() {
    if (!budget || deleting || updatingStatus || duplicating) return;
    setDeleting(true);
    setActionError(null);
    setActionFeedback(null);
    try {
      const removed = await savedBudgetsRepository.delete(budget.id);
      if (!removed) {
        setActionError('Este orçamento não está mais no histórico. Volte e atualize a lista.');
        setConfirmingDelete(false);
        return;
      }
      setConfirmingDelete(false);
      router.replace('/orcamentos' as Href);
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : 'Não foi possível excluir este orçamento. Tente novamente.');
    } finally {
      setDeleting(false);
    }
  }

  function retryLoad() {
    setLoadAttempt((attempt) => attempt + 1);
  }

  function openHistory() {
    router.replace('/orcamentos' as Href);
  }

  if (loading) return <BudgetScreen title="Orçamento" onBack={back}><LoadingMessage label="Carregando orçamento…" /></BudgetScreen>;
  if (error || !budget) return <BudgetScreen title="Orçamento indisponível" subtitle={error ?? 'Não foi possível ler o registro.'} onBack={back}>
    <BudgetButton label="Tentar carregar novamente" onPress={retryLoad} />
    <BudgetButton label="Voltar ao histórico" onPress={back} />
  </BudgetScreen>;

  const pricing = pricingSummary(budget);
  const actionsBusy = duplicating || updatingStatus || deleting;
  return <BudgetScreen title={budget.client.name} subtitle={`${savedBudgetServiceLabels[budget.service]} · atualizado em ${formatBudgetHistoryDate(budget.updatedAt)}`} onBack={back}>
    <View style={styles.actions}>
      {!!actionError && <Text accessibilityRole="alert" style={styles.error}>{actionError}</Text>}
      {!!actionFeedback && <Text accessibilityRole="alert" style={styles.success}>{actionFeedback}</Text>}
      <BudgetButton label="Editar orçamento" disabled={actionsBusy || confirmingDelete} onPress={edit} />
      <SavedBudgetDocumentActions budget={budget} />
      <BudgetButton label={duplicating ? 'Duplicando…' : 'Duplicar orçamento'} disabled={actionsBusy || confirmingDelete} onPress={() => { void duplicate(); }} />
      {!confirmingDelete && <Pressable accessibilityRole="button" disabled={actionsBusy}
        accessibilityState={{ disabled: actionsBusy }} onPress={() => { setActionError(null); setActionFeedback(null); setConfirmingDelete(true); }}
        style={({ pressed }) => [styles.deleteButton, actionsBusy && styles.disabledButton, pressed && !actionsBusy && styles.pressed]}>
        <Text style={styles.deleteButtonText}>Excluir orçamento</Text>
      </Pressable>}
    </View>
    <BudgetCard title="Status e valores">
      <BudgetLine label="Status atual" value={savedBudgetStatusLabels[budget.status]} />
      <View accessibilityRole="radiogroup" accessibilityLabel="Alterar status do orçamento" style={styles.statusOptions}>
        {budgetStatuses.map((status) => {
          const selected = status === budget.status;
          return <Pressable key={status} accessibilityRole="radio" accessibilityState={{ checked: selected, disabled: actionsBusy || selected }}
            disabled={actionsBusy || selected} onPress={() => { void updateStatus(status); }}
            style={({ pressed }) => [styles.statusOption, selected && styles.statusOptionSelected, pressed && styles.pressed]}>
            <Text style={[styles.statusOptionText, selected && styles.statusOptionTextSelected]}>{savedBudgetStatusLabels[status]}</Text>
          </Pressable>;
        })}
      </View>
      {updatingStatus && <Text style={styles.statusFeedback}>Atualizando status…</Text>}
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
    {confirmingDelete && <BudgetCard title="Confirmar exclusão">
      <Text style={styles.confirmationText}>{budget.client.name} · {savedBudgetServiceLabels[budget.service]}</Text>
      <Text style={styles.confirmationText}>Este orçamento será removido do histórico salvo neste dispositivo. Esta ação não pode ser desfeita.</Text>
      <View style={styles.confirmationActions}>
        <Pressable accessibilityRole="button" disabled={deleting} accessibilityState={{ disabled: deleting }}
          onPress={() => { void deleteBudget(); }} style={({ pressed }) => [styles.confirmDeleteButton, deleting && styles.disabledButton, pressed && !deleting && styles.pressed]}>
          <Text style={styles.confirmDeleteButtonText}>{deleting ? 'Excluindo…' : 'Excluir definitivamente'}</Text>
        </Pressable>
        <Pressable accessibilityRole="button" disabled={deleting} accessibilityState={{ disabled: deleting }}
          onPress={() => setConfirmingDelete(false)} style={({ pressed }) => [styles.cancelButton, deleting && styles.disabledButton, pressed && !deleting && styles.pressed]}>
          <Text style={styles.cancelButtonText}>Cancelar</Text>
        </Pressable>
      </View>
    </BudgetCard>}
  </BudgetScreen>;
}

const styles = StyleSheet.create({
  actions: { gap: 10 },
  error: { color: '#A33232', fontSize: 13, lineHeight: 20 },
  success: { color: '#087354', fontSize: 13, lineHeight: 20 },
  statusOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingTop: 8 },
  statusOption: { minHeight: 42, paddingHorizontal: 12, paddingVertical: 9, justifyContent: 'center', borderRadius: 12, borderWidth: 1, borderColor: '#C5CECA', backgroundColor: '#FFFFFF' },
  statusOptionSelected: { borderColor: '#087354', backgroundColor: '#087354' },
  statusOptionText: { color: '#24352E', fontSize: 13, fontWeight: '600' },
  statusOptionTextSelected: { color: '#FFFFFF' },
  statusFeedback: { color: '#60706A', fontSize: 13, lineHeight: 20 },
  confirmationText: { color: '#60706A', fontSize: 14, lineHeight: 21 },
  confirmationActions: { gap: 8 },
  deleteButton: { minHeight: 52, padding: 14, alignItems: 'center', justifyContent: 'center', borderRadius: 14, borderWidth: 1.5, borderColor: '#A33232', backgroundColor: '#FFFFFF' },
  deleteButtonText: { color: '#A33232', fontSize: 16, fontWeight: '700' },
  confirmDeleteButton: { minHeight: 52, padding: 14, alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: '#A33232' },
  confirmDeleteButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  cancelButton: { minHeight: 48, padding: 12, alignItems: 'center', justifyContent: 'center', borderRadius: 14, borderWidth: 1, borderColor: '#C5CECA' },
  cancelButtonText: { color: '#24352E', fontSize: 15, fontWeight: '600' },
  disabledButton: { opacity: 0.55 },
  pressed: { opacity: 0.75 },
});
