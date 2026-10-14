import { BudgetValuesForm } from '@/components/budget/budget-values-form';
import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text } from 'react-native';
import { BudgetButton, BudgetScreen } from '@/components/budget/budget-screen';
import { BudgetCard } from '@/components/budget/budget-card';
import { WallMaterialResults } from '@/components/budget/wall-material-results';
import { calculateWallMaterials } from '@/domain/calculations/wallMaterials';
import { calculateWallPricing } from '@/domain/calculations/wallPricing';
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

  return <BudgetValuesForm key={JSON.stringify({ budget, initialValues })} billingArea={materials.wallArea} initialValues={initialValues} onBack={handleBack}
    areaNote="A cobrança utiliza a área da parede, sem multiplicar pela quantidade de lados ou pela margem de perda."
    calculatePricing={(values) => calculateWallPricing(budget.measurements, values)}
    onContinue={(values) => router.push({ pathname: '/orcamento/resumo', params: { orcamento: JSON.stringify(budget), valores: JSON.stringify(values) } })} />;
}

const styles = StyleSheet.create({ note: { color: '#60706A', fontSize: 14, lineHeight: 21 } });
