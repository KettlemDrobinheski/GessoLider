import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import type { SavedBudget } from '@/types/saved-budget';
import type { ClientData } from '@/types/client';
import { savedBudgetsRepository } from '@/services/saved-budgets';
import { useBudgetDraft } from '@/hooks/use-budget-draft';
import { suggestServiceDescription } from '@/utils/service-description';
import { BudgetButton } from './budget-screen';
import { BudgetCard } from './budget-card';

type Service = SavedBudget['service'];

export function ServiceDescriptionEditor({ service, client, dimensions, savedBudgetId, value, onChange, onCustomizedChange }: {
  service: Service; client: ClientData | null; dimensions?: { length?: number; width?: number; height?: number };
  savedBudgetId?: string; value: string; onChange: (value: string) => void; onCustomizedChange: (customized: boolean) => void;
}) {
  const { draft, status, saveFields } = useBudgetDraft();
  const suggestion = suggestServiceDescription(service, client, dimensions);
  const initialized = useRef(false);
  const customized = useRef(false);
  const [savedDescription, setSavedDescription] = useState<string | null | undefined>(undefined);
  const [savedCustomized, setSavedCustomized] = useState<boolean | null>(null);

  useEffect(() => {
    let active = true;
    if (!savedBudgetId) { setSavedDescription(null); setSavedCustomized(null); return () => { active = false; }; }
    setSavedDescription(undefined);
    setSavedCustomized(null);
    void savedBudgetsRepository.getById(savedBudgetId).then((record) => {
      if (active) { setSavedDescription(record?.serviceDescription ?? null); setSavedCustomized(record?.serviceDescriptionCustomized ?? (record?.serviceDescription ? true : false)); }
    }).catch(() => { if (active) { setSavedDescription(null); setSavedCustomized(false); } });
    return () => { active = false; };
  }, [savedBudgetId]);

  useEffect(() => {
    if (initialized.current || (savedBudgetId && savedDescription === undefined) || (!savedBudgetId && status === 'loading')) return;
    const draftValue = draft?.service === service && typeof draft.formData.serviceDescription === 'string'
      ? draft.formData.serviceDescription : null;
    const persisted = savedBudgetId ? savedDescription : draftValue;
    if (persisted !== null && persisted !== undefined) {
      const isCustomized = savedBudgetId ? savedCustomized !== false : draft?.formData.serviceDescriptionCustomized !== false;
      customized.current = isCustomized;
      onCustomizedChange(isCustomized);
      onChange(persisted);
    } else { customized.current = false; onCustomizedChange(false); onChange(suggestion); }
    initialized.current = true;
  }, [savedBudgetId, savedDescription, savedCustomized, status, draft, service, suggestion, onChange]);

  useEffect(() => {
    if (!initialized.current || customized.current) return;
    onChange(suggestion);
    if (!savedBudgetId) void saveFields({ serviceDescription: suggestion, serviceDescriptionCustomized: false }, service).catch(() => undefined);
  }, [suggestion, savedBudgetId, service, onChange, saveFields]);

  function changeDescription(text: string) {
    customized.current = true;
    onCustomizedChange(true);
    onChange(text);
    if (!savedBudgetId) void saveFields({ serviceDescription: text, serviceDescriptionCustomized: true }, service).catch(() => undefined);
  }

  function restoreSuggestion() {
    customized.current = false;
    onCustomizedChange(false);
    onChange(suggestion);
    if (!savedBudgetId) void saveFields({ serviceDescription: suggestion, serviceDescriptionCustomized: false }, service).catch(() => undefined);
  }

  return <BudgetCard title="Descrição dos serviços contratados">
    <View style={styles.container}>
      <Text style={styles.hint}>Revise e ajuste o texto para refletir o que foi combinado para esta obra.</Text>
      <TextInput accessibilityLabel="Descrição dos serviços contratados" multiline value={value} onChangeText={changeDescription}
        textAlignVertical="top" style={styles.input} placeholder="Descreva os serviços contratados" />
      <BudgetButton label="Restaurar sugestão inicial" onPress={restoreSuggestion} />
    </View>
  </BudgetCard>;
}

const styles = StyleSheet.create({ container: { gap: 12 }, hint: { color: '#60706A', fontSize: 13, lineHeight: 20 },
  input: { minHeight: 120, borderWidth: 1, borderColor: '#CBD5D0', borderRadius: 12, padding: 12, color: '#24352E', fontSize: 15, lineHeight: 22, textAlignVertical: 'top' } });
