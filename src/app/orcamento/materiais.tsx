import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SymbolView } from 'expo-symbols';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BudgetSteps } from '@/components/budget/budget-steps';
import { WallMaterialResults } from '@/components/budget/wall-material-results';
import { Brand } from '@/constants/brand';
import { insulationOptions, sidesOptions } from '@/constants/wall-configuration';
import { calculateWallMaterials } from '@/domain/calculations/wallMaterials';
import { formatArea } from '@/utils/measurements';
import { parseWallBudgetInput } from '@/utils/wall-configuration';
import { BudgetButton } from '@/components/budget/budget-screen';

export default function MaterialsScreen() {
  const { orcamento, valores } = useLocalSearchParams<{ orcamento?: string | string[]; valores?: string | string[] }>();
  const budget = parseWallBudgetInput(orcamento);
  const result = budget ? calculateWallMaterials({ ...budget.measurements, ...budget.configuration }) : null;

  function handleBack() {
    if (router.canGoBack()) router.back();
    else if (budget) router.replace({ pathname: '/orcamento/configuracao-parede', params: {
      orcamento: JSON.stringify(budget),
      ...(typeof valores === 'string' ? { valores } : {}),
    } });
    else router.replace({ pathname: '/orcamento/medidas', params: { servico: 'wall' } });
  }

  function handleContinue() {
    if (!budget || result?.status !== 'valid') return;
    router.push({ pathname: '/orcamento/valores', params: {
      orcamento: JSON.stringify(budget), ...(typeof valores === 'string' ? { valores } : {}),
    } });
  }

  function formatMeasure(value: number) {
    return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Pressable accessibilityRole="button" accessibilityLabel="Voltar" onPress={handleBack}
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
          <SymbolView name={{ ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' }} size={24} tintColor={Brand.dark} />
        </Pressable>
        <Text accessibilityRole="header" style={styles.headerTitle}>Novo Orçamento</Text>
        <View style={styles.headerBalance} />
      </View>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scroll}>
        <View style={styles.content}>
          <BudgetSteps activeStep={3} />
          <View style={styles.introduction}>
            <Text accessibilityRole="header" style={styles.title}>Materiais Calculados</Text>
            <Text style={styles.subtitle}>Confira a estimativa inicial para esta parede.</Text>
          </View>
          {budget && result ? (
            <>
              <View style={styles.summary}>
                <Text accessibilityRole="header" style={styles.summaryTitle}>Parede</Text>
                <Text style={styles.dimensions}>{formatMeasure(budget.measurements.length)} × {formatMeasure(budget.measurements.height)} m</Text>
                <Text style={styles.summaryText}>Perfil: {budget.configuration.profileWidth} mm</Text>
                <Text style={styles.summaryText}>Espaçamento: {budget.configuration.studSpacingCm} cm</Text>
                {result.status === 'valid' && (
                  <>
                    <Text style={styles.summaryText}>Área: {formatArea(result.wallArea)}</Text>
                    <Text style={styles.summaryText}>Aplicação: {sidesOptions.find((option) => option.value === result.sides)?.label}</Text>
                    <Text style={styles.summaryText}>Área de revestimento: {formatArea(result.coveringArea)}</Text>
                    <Text style={styles.summaryText}>Margem: {result.wastePercent}%</Text>
                    <Text style={styles.summaryText}>Área considerada: {formatArea(result.areaWithWaste)}</Text>
                    <Text style={styles.summaryText}>Isolamento: {insulationOptions.find((option) => option.value === budget.configuration.insulation)?.label ?? 'Não'}</Text>
                  </>
                )}
              </View>
              <WallMaterialResults result={result} />
            </>
          ) : (
            <View accessibilityRole="alert" style={styles.summary}>
              <Text style={styles.summaryTitle}>Não foi possível ler os dados do orçamento.</Text>
              <Text style={styles.subtitle}>Volte e confira as medidas e a configuração da parede.</Text>
            </View>
          )}
          {result?.status !== 'valid' && (
            <Pressable accessibilityRole="button" onPress={handleBack}
              style={({ pressed }) => [styles.adjustButton, pressed && styles.pressed]}>
              <Text style={styles.adjustText}>Voltar e ajustar</Text>
            </Pressable>
          )}
        </View>
      </ScrollView>
      <View style={styles.footer}>
        <BudgetButton label="Continuar" onPress={handleContinue} disabled={result?.status !== 'valid'} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Brand.white },
  header: { width: '100%', maxWidth: 640, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 12 },
  backButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 12 },
  headerTitle: { flex: 1, color: Brand.dark, fontSize: 20, fontWeight: '700', textAlign: 'center' },
  headerBalance: { width: 44 },
  scrollView: { flex: 1 },
  scroll: { flexGrow: 1, alignItems: 'center' },
  content: { width: '100%', maxWidth: 640, padding: 20, gap: 24 },
  footer: { width: '100%', maxWidth: 640, alignSelf: 'center', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16 },
  introduction: { gap: 8 },
  title: { color: Brand.dark, fontSize: 24, lineHeight: 32, fontWeight: '700' },
  subtitle: { color: '#60706A', fontSize: 14, lineHeight: 21 },
  summary: { padding: 16, gap: 10, borderWidth: 1, borderColor: Brand.accent, borderRadius: 16, backgroundColor: '#EDF7F1' },
  summaryTitle: { color: Brand.dark, fontSize: 18, lineHeight: 26, fontWeight: '700' },
  dimensions: { color: Brand.primary, fontSize: 20, lineHeight: 28, fontWeight: '600' },
  summaryText: { color: Brand.dark, fontSize: 14, lineHeight: 21 },
  adjustButton: { minHeight: 56, padding: 16, borderRadius: 16, backgroundColor: Brand.primary, alignItems: 'center', justifyContent: 'center' },
  adjustText: { color: Brand.white, fontSize: 18, fontWeight: '700', textAlign: 'center' },
  pressed: { opacity: 0.8 },
});
