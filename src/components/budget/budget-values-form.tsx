import { useState } from 'react';
import { StyleSheet, Text, TextInput } from 'react-native';
import { BudgetButton, BudgetScreen } from './budget-screen';
import { BudgetCard, BudgetLine } from './budget-card';
import { CurrencyField } from './currency-field';
import { PricingSummary } from './pricing-summary';
import { Brand } from '@/constants/brand';
import type { BudgetPricing, BudgetPricingInput } from '@/types/budget-pricing';
import { formatCurrencyInput, parseCurrencyInput } from '@/utils/currency';
import { formatArea } from '@/utils/measurements';

export function BudgetValuesForm({ billingArea, initialValues, onBack, calculatePricing, onContinue, areaNote }: {
  billingArea: number; initialValues: BudgetPricingInput | null; onBack: () => void;
  calculatePricing: (values: BudgetPricingInput) => BudgetPricing | null;
  onContinue: (values: BudgetPricingInput) => void; areaNote: string;
}) {
  const [laborInput, setLaborInput] = useState(initialValues ? formatCurrencyInput(initialValues.laborRate) : '');
  const [materialsInput, setMaterialsInput] = useState(initialValues ? formatCurrencyInput(initialValues.materialsTotal) : '');
  const [notes, setNotes] = useState(initialValues?.notes ?? '');
  const laborRate = parseCurrencyInput(laborInput);
  const materialsTotal = parseCurrencyInput(materialsInput);
  const values = laborRate !== null && laborRate > 0 && materialsTotal !== null ? { laborRate, materialsTotal, notes } : null;
  const pricing = values ? calculatePricing(values) : null;

  function handleContinue() {
    if (!pricing || !values) return;
    onContinue(values);
  }

  return (
    <BudgetScreen title="Valores" subtitle="Informe a mão de obra e o valor total dos materiais." activeStep={3} onBack={onBack} keyboard
      footer={<BudgetButton label="Continuar" disabled={!pricing} onPress={handleContinue} />}>
      <BudgetCard title="Mão de obra">
        <BudgetLine label="Área para cobrança" value={formatArea(billingArea)} />
        <Text style={styles.note}>{areaNote}</Text>
        <CurrencyField label="Valor da mão de obra por m²" value={laborInput} onChangeText={setLaborInput}
          error={laborRate === null || laborRate <= 0 ? 'Informe um valor maior que zero, com até duas casas decimais.' : undefined} />
      </BudgetCard>
      <BudgetCard title="Materiais">
        <Text style={styles.note}>Informe o total do orçamento recebido da loja. Use zero se o cliente fornecer os materiais.</Text>
        <CurrencyField label="Valor total dos materiais" value={materialsInput} onChangeText={setMaterialsInput}
          error={materialsTotal === null ? 'Informe um valor igual ou maior que zero, com até duas casas decimais.' : undefined} />
      </BudgetCard>
      <BudgetCard title="Observações do orçamento">
        <TextInput accessibilityLabel="Observações do orçamento" value={notes} onChangeText={setNotes} multiline
          textAlignVertical="top" style={styles.notes} />
      </BudgetCard>
      {pricing && <PricingSummary pricing={pricing} />}
      {values && !pricing && <Text accessibilityRole="alert" style={styles.error}>Revise os valores: o total excede o intervalo numérico permitido.</Text>}
    </BudgetScreen>
  );
}

const styles = StyleSheet.create({
  note: { color: '#60706A', fontSize: 14, lineHeight: 21 },
  notes: { minHeight: 120, borderWidth: 1.5, borderColor: '#C5CECA', borderRadius: 12, padding: 14, fontSize: 16, color: Brand.dark },
  error: { color: '#A33232', fontSize: 14, lineHeight: 21 },
});
