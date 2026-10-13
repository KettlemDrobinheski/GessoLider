import { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, TextInput } from 'react-native';
import { BudgetButton, BudgetScreen } from '@/components/budget/budget-screen';
import { BudgetCard, BudgetLine } from '@/components/budget/budget-card';
import { CurrencyField } from '@/components/budget/currency-field';
import { PricingSummary } from '@/components/budget/pricing-summary';
import { WallMaterialResults } from '@/components/budget/wall-material-results';
import { Brand } from '@/constants/brand';
import { calculateWallMaterials } from '@/domain/calculations/wallMaterials';
import { calculateWallPricing } from '@/domain/calculations/wallPricing';
import type { WallBudgetInput } from '@/types/wall-configuration';
import type { WallPricingInput } from '@/types/wall-pricing';
import { formatCurrencyInput, parseCurrencyInput } from '@/utils/currency';
import { formatArea } from '@/utils/measurements';
import { parseWallBudgetInput } from '@/utils/wall-configuration';
import { parseWallPricingInput } from '@/utils/wall-pricing';

export default function ValuesScreen() {
  const { orcamento, valores } = useLocalSearchParams<{ orcamento?: string | string[]; valores?: string | string[] }>();
  const budget = parseWallBudgetInput(orcamento);
  const initialValues = parseWallPricingInput(valores);
  const materials = budget ? calculateWallMaterials({ ...budget.measurements, ...budget.configuration }) : null;

  function handleBack() {
    if (router.canGoBack()) router.back();
    else router.replace({ pathname: '/orcamento/materiais', params: {
      ...(budget ? { orcamento: JSON.stringify(budget) } : {}),
      ...(initialValues ? { valores: JSON.stringify(initialValues) } : {}),
    } });
  }

  if (!budget || materials?.status !== 'valid') {
    return (
      <BudgetScreen title="Valores" activeStep={3} onBack={handleBack}>
        {materials ? <WallMaterialResults result={materials} /> : <BudgetCard title="Revise os dados da parede"><Text style={styles.note}>Informe as medidas e a configuração antes de definir os valores.</Text></BudgetCard>}
        <BudgetButton label="Voltar e ajustar" onPress={handleBack} />
      </BudgetScreen>
    );
  }

  return <ValuesForm key={JSON.stringify({ budget, initialValues })} budget={budget} wallArea={materials.wallArea} initialValues={initialValues} onBack={handleBack} />;
}

function ValuesForm({ budget, wallArea, initialValues, onBack }: {
  budget: WallBudgetInput; wallArea: number; initialValues: WallPricingInput | null; onBack: () => void;
}) {
  const [laborInput, setLaborInput] = useState(initialValues ? formatCurrencyInput(initialValues.laborRate) : '');
  const [materialsInput, setMaterialsInput] = useState(initialValues ? formatCurrencyInput(initialValues.materialsTotal) : '');
  const [notes, setNotes] = useState(initialValues?.notes ?? '');
  const laborRate = parseCurrencyInput(laborInput);
  const materialsTotal = parseCurrencyInput(materialsInput);
  const values = laborRate !== null && laborRate > 0 && materialsTotal !== null ? { laborRate, materialsTotal, notes } : null;
  const pricing = values ? calculateWallPricing(budget.measurements, values) : null;

  function handleContinue() {
    if (!pricing || !values) return;
    router.push({ pathname: '/orcamento/resumo', params: { orcamento: JSON.stringify(budget), valores: JSON.stringify(values) } });
  }

  return (
    <BudgetScreen title="Valores" subtitle="Informe a mão de obra e o valor total dos materiais." activeStep={3} onBack={onBack} keyboard
      footer={<BudgetButton label="Continuar" disabled={!pricing} onPress={handleContinue} />}>
      <BudgetCard title="Mão de obra">
        <BudgetLine label="Área para cobrança" value={formatArea(wallArea)} />
        <Text style={styles.note}>A cobrança utiliza a área da parede, sem multiplicar pela quantidade de lados ou pela margem de perda.</Text>
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
