import { useState } from 'react';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SymbolView } from 'expo-symbols';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Brand } from '@/constants/brand';
import { boardDimensionLabel, boardOptions, insulationChoices, insulationOptions, profileOptions, sidesOptions } from '@/constants/wall-configuration';
import type { WallBudgetInput, WallConfigurationDraft, WallMeasurements } from '@/types/wall-configuration';
import { buildWallConfiguration } from '@/utils/wall-configuration';
import { BudgetSteps } from './budget-steps';
import { ConfigurationOption } from './configuration-option';
import { ConfigurationSection } from './configuration-section';
import { WallConfigurationSummary } from './wall-configuration-summary';

type Props = { measurements: WallMeasurements; onContinue?: (budget: WallBudgetInput) => void };

export function WallConfigurationForm({ measurements, onContinue }: Props) {
  const [draft, setDraft] = useState<WallConfigurationDraft>({
    boardType: null, profileWidth: null, sides: null, hasInsulation: false, insulationType: null,
  });
  const configuration = buildWallConfiguration(draft);

  function updateDraft(update: Partial<WallConfigurationDraft>) {
    setDraft((current) => ({ ...current, ...update }));
  }

  function handleBack() {
    if (router.canGoBack()) router.back();
    else router.replace({ pathname: '/orcamento/medidas', params: { servico: measurements.service } });
  }

  function handleContinue() {
    if (configuration === null) return;
    onContinue?.({ measurements, configuration });
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
          <BudgetSteps activeStep={2} />
          <View style={styles.introduction}>
            <Text accessibilityRole="header" style={styles.title}>Configuração da Parede</Text>
            <Text style={styles.subtitle}>Escolha os materiais que serão utilizados.</Text>
          </View>
          <ConfigurationSection title="Tipo de placa">
            {boardOptions.map((option) => (
              <ConfigurationOption key={option.value} label={option.label} description={boardDimensionLabel}
                selected={draft.boardType === option.value} onSelect={() => updateDraft({ boardType: option.value })} />
            ))}
          </ConfigurationSection>
          <ConfigurationSection title="Perfil da parede">
            {profileOptions.map((option) => (
              <ConfigurationOption key={option.value} label={option.label} selected={draft.profileWidth === option.value}
                onSelect={() => updateDraft({ profileWidth: option.value })} />
            ))}
          </ConfigurationSection>
          <ConfigurationSection title="Aplicação das placas">
            {sidesOptions.map((option) => (
              <ConfigurationOption key={option.value} label={option.label} selected={draft.sides === option.value}
                onSelect={() => updateDraft({ sides: option.value })} />
            ))}
          </ConfigurationSection>
          <ConfigurationSection title="Utilizar isolamento?">
            {insulationChoices.map((option) => (
              <ConfigurationOption key={option.label} label={option.label} selected={draft.hasInsulation === option.value}
                onSelect={() => updateDraft({ hasInsulation: option.value, ...(option.value ? {} : { insulationType: null }) })} />
            ))}
          </ConfigurationSection>
          {draft.hasInsulation && (
            <ConfigurationSection title="Tipo de isolamento">
              {insulationOptions.map((option) => (
                <ConfigurationOption key={option.value} label={option.label} selected={draft.insulationType === option.value}
                  onSelect={() => updateDraft({ insulationType: option.value })} />
              ))}
            </ConfigurationSection>
          )}
          <WallConfigurationSummary draft={draft} />
        </View>
      </ScrollView>
      <View style={styles.footer}>
        <Pressable accessibilityRole="button" accessibilityState={{ disabled: configuration === null }} disabled={configuration === null}
          onPress={handleContinue} style={({ pressed }) => [styles.continueButton, configuration === null && styles.disabledButton, pressed && styles.pressed]}>
          <Text style={[styles.continueText, configuration === null && styles.disabledText]}>Continuar</Text>
        </Pressable>
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
  introduction: { gap: 8 },
  title: { color: Brand.dark, fontSize: 24, lineHeight: 32, fontWeight: '700' },
  subtitle: { color: '#60706A', fontSize: 14, lineHeight: 21 },
  footer: { width: '100%', maxWidth: 640, alignSelf: 'center', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16 },
  continueButton: { minHeight: 56, padding: 16, borderRadius: 16, backgroundColor: Brand.primary, alignItems: 'center', justifyContent: 'center' },
  disabledButton: { backgroundColor: '#E2E8E5' },
  continueText: { color: Brand.white, fontSize: 18, fontWeight: '700', textAlign: 'center' },
  disabledText: { color: '#60706A' },
  pressed: { opacity: 0.8 },
});
