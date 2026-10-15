import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import type { ClientData } from '@/types/client';
import { emptyClient, formatCep, formatPhone, validateClient } from '@/utils/client';
import { Brand } from '@/constants/brand';
import { BudgetButton, BudgetScreen } from './budget-screen';
import { BudgetCard } from './budget-card';

const fields: { key: keyof ClientData; label: string; keyboard?: 'phone-pad' | 'number-pad'; multiline?: boolean }[] = [
  { key: 'name', label: 'Nome do cliente *' }, { key: 'phone', label: 'Telefone (opcional)', keyboard: 'phone-pad' },
  { key: 'cep', label: 'CEP (opcional)', keyboard: 'number-pad' }, { key: 'street', label: 'Rua' },
  { key: 'number', label: 'Número' }, { key: 'neighborhood', label: 'Bairro' }, { key: 'city', label: 'Cidade' },
  { key: 'state', label: 'Estado' }, { key: 'complement', label: 'Complemento' },
  { key: 'notes', label: 'Observações do cliente / obra', multiline: true },
];

export function ClientForm({ initialClient, onBack, onContinue }: {
  initialClient: ClientData | null; onBack: () => void; onContinue: (client: ClientData) => void;
}) {
  const [draft, setDraft] = useState<ClientData>(() => ({
    ...(initialClient ?? emptyClient), phone: formatPhone(initialClient?.phone ?? ''), cep: formatCep(initialClient?.cep ?? ''),
  }));
  const [touched, setTouched] = useState<Partial<Record<keyof ClientData, boolean>>>({});
  const validation = validateClient(draft);
  function next() { if (validation.value) onContinue(validation.value); }
  return (
    <BudgetScreen title="Dados do Cliente" subtitle="Informe o cliente e o endereço da obra. Apenas o nome é obrigatório." activeStep="client" onBack={onBack} keyboard
      footer={<BudgetButton label="Continuar" disabled={!validation.value} onPress={next} />}>
      <BudgetCard title="Cliente e obra">
        {fields.map(({ key, label, keyboard, multiline }) => {
          const error = touched[key] || draft[key].length > 0 ? validation.errors[key] : undefined;
          return <View key={key} style={styles.field}>
            <Text style={styles.label}>{label}</Text>
            <TextInput accessibilityLabel={label} aria-invalid={!!error} aria-describedby={error ? `client-${key}-error` : undefined}
              value={draft[key]} keyboardType={keyboard} multiline={multiline}
              autoCapitalize={key === 'state' ? 'characters' : key === 'notes' ? 'sentences' : 'words'}
              onBlur={() => setTouched((current) => ({ ...current, [key]: true }))}
              onChangeText={(text) => setDraft((current) => ({ ...current, [key]: key === 'phone' ? formatPhone(text) : key === 'cep' ? formatCep(text) : text }))}
              style={[styles.input, multiline && styles.notes, !!error && styles.invalid]} textAlignVertical={multiline ? 'top' : 'center'} />
            {!!error && <Text nativeID={`client-${key}-error`} style={styles.error}>{error}</Text>}
          </View>;
        })}
      </BudgetCard>
    </BudgetScreen>
  );
}

const styles = StyleSheet.create({
  field: { gap: 8 }, label: { color: Brand.dark, fontSize: 15, fontWeight: '600' },
  input: { minHeight: 54, borderWidth: 1.5, borderColor: '#C5CECA', borderRadius: 12, padding: 14, fontSize: 16, color: Brand.dark },
  notes: { minHeight: 120 }, invalid: { borderColor: '#A33232' }, error: { color: '#A33232', fontSize: 12, lineHeight: 18 },
});
