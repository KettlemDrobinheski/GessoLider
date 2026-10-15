import { useMemo } from 'react';
import { useBudgetClient } from '@/hooks/use-budget-client';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WallConfigurationForm } from '@/components/budget/wall-configuration-form';
import { Brand } from '@/constants/brand';
import { parseWallBudgetInput, parseWallMeasurements } from '@/utils/wall-configuration';

export default function WallConfigurationScreen() {
  const { clientParams } = useBudgetClient();
  const { parede, orcamento, valores } = useLocalSearchParams<{ parede?: string | string[]; orcamento?: string | string[]; valores?: string | string[] }>();
  const savedBudget = useMemo(() => parseWallBudgetInput(orcamento), [orcamento]);
  const measurements = savedBudget?.measurements ?? parseWallMeasurements(parede);

  if (!measurements) {
    return (
      <SafeAreaView style={styles.screen}>
        <StatusBar style="dark" />
        <View style={styles.content}>
          <Text accessibilityRole="header" style={styles.title}>Informe as medidas da parede</Text>
          <Text style={styles.subtitle}>Volte à etapa Medidas para continuar a configuração.</Text>
          <Pressable accessibilityRole="button" onPress={() => router.replace({ pathname: '/orcamento/medidas', params: { ...clientParams, servico: 'wall' } })}
            style={styles.button}>
            <Text style={styles.buttonText}>Voltar às medidas</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <WallConfigurationForm key={JSON.stringify(savedBudget ?? measurements)} measurements={measurements} initialConfiguration={savedBudget?.configuration}
      onContinue={(budget) => router.push({ pathname: '/orcamento/materiais', params: { ...clientParams,
        orcamento: JSON.stringify(budget), ...(typeof valores === 'string' ? { valores } : {}),
      } })} />
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Brand.white },
  content: { width: '100%', maxWidth: 640, alignSelf: 'center', padding: 24, gap: 20 },
  title: { color: Brand.dark, fontSize: 24, lineHeight: 32, fontWeight: '700' },
  subtitle: { color: '#60706A', fontSize: 14, lineHeight: 21 },
  button: { minHeight: 56, padding: 16, borderRadius: 16, backgroundColor: Brand.primary, alignItems: 'center', justifyContent: 'center' },
  buttonText: { color: Brand.white, fontSize: 18, fontWeight: '700', textAlign: 'center' },
});
