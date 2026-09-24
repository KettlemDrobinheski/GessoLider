import { useRef, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SymbolView } from 'expo-symbols';
import { Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AreaSummary } from '@/components/budget/area-summary';
import { BudgetSteps } from '@/components/budget/budget-steps';
import { MeasurementField } from '@/components/budget/measurement-field';
import { OpeningCard } from '@/components/budget/opening-card';
import { Brand } from '@/constants/brand';
import { serviceOptions, type ServiceOption } from '@/constants/services';
import type { MeasurementDraft, OpeningDraft } from '@/types/measurements';
import { dimensionFields, dimensionLabels, validateMeasurements } from '@/utils/measurements';

export default function MeasurementsScreen() {
  const { servico } = useLocalSearchParams<{ servico?: string | string[] }>();
  const service = typeof servico === 'string' ? serviceOptions.find((option) => option.id === servico) : undefined;

  if (!service) {
    return (
      <SafeAreaView style={styles.screen}>
        <StatusBar style="dark" />
        <View style={styles.invalidService}>
          <Text accessibilityRole="header" style={styles.title}>Selecione um serviço</Text>
          <Text style={styles.subtitle}>Escolha o tipo de serviço para informar as medidas.</Text>
          <Pressable accessibilityRole="button" onPress={() => router.replace('/orcamento/tipo-servico')} style={styles.continueButton}>
            <Text style={styles.continueText}>Escolher serviço</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return <MeasurementsForm key={service.id} service={service} />;
}

function MeasurementsForm({ service }: { service: ServiceOption }) {
  const [dimensions, setDimensions] = useState<MeasurementDraft>({ length: '', height: '', width: '', depth: '' });
  const [hasOpenings, setHasOpenings] = useState(false);
  const [openings, setOpenings] = useState<OpeningDraft[]>([]);
  const nextOpeningId = useRef(1);
  const validation = validateMeasurements(service.id, dimensions, hasOpenings, openings);
  const canContinue = validation.value !== null;

  function addOpening() {
    const opening: OpeningDraft = {
      id: `opening-${nextOpeningId.current++}`, type: 'door', width: '', height: '', quantity: '1',
    };
    setOpenings((current) => [...current, opening]);
  }

  function changeHasOpenings(value: boolean) {
    setHasOpenings(value);
    if (value && openings.length === 0) addOpening();
  }

  function handleBack() {
    if (router.canGoBack()) router.back();
    else router.replace('/orcamento/tipo-servico');
  }

  function handleContinue() {
    if (validation.value === null) return;
    Keyboard.dismiss();
  }

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : Platform.OS === 'android' ? 'height' : undefined}>
        <View style={styles.header}>
          <Pressable accessibilityRole="button" accessibilityLabel="Voltar" onPress={handleBack}
            style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
            <SymbolView name={{ ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' }} size={24} tintColor={Brand.dark} />
          </Pressable>
          <Text accessibilityRole="header" style={styles.headerTitle}>Novo Orçamento</Text>
          <View style={styles.headerBalance} />
        </View>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
          <View style={styles.content}>
            <BudgetSteps activeStep={2} />
            <View style={styles.introduction}>
              <Text style={styles.service}>{service.title}</Text>
              <Text accessibilityRole="header" style={styles.title}>Informe as medidas</Text>
              <Text style={styles.subtitle}>Adicione as dimensões do serviço para calcular os materiais.</Text>
            </View>

            <View style={styles.dimensionRow}>
              {dimensionFields[service.id].map((key) => (
                <MeasurementField key={key} label={dimensionLabels[key]} value={dimensions[key]} error={validation.fields[key]}
                  onChangeText={(value) => setDimensions((current) => ({ ...current, [key]: value }))} />
              ))}
            </View>
            {service.id === 'details' && <Text style={styles.subtitle}>Informe as dimensões básicas do projeto. Nichos e detalhes precisam de configuração específica para o cálculo de materiais.</Text>}

            {service.id === 'wall' && (
              <View style={styles.section}>
                <Text accessibilityRole="header" style={styles.sectionTitle}>Possui portas ou janelas?</Text>
                <View accessibilityRole="radiogroup" accessibilityLabel="Possui portas ou janelas?" style={styles.choiceRow}>
                  {[{ label: 'Não', value: false }, { label: 'Sim', value: true }].map((choice) => (
                    <Pressable key={choice.label} accessibilityRole="radio" aria-checked={hasOpenings === choice.value}
                      accessibilityState={{ checked: hasOpenings === choice.value }} onPress={() => changeHasOpenings(choice.value)}
                      style={({ pressed }) => [styles.choice, hasOpenings === choice.value && styles.selectedChoice, pressed && styles.pressed]}>
                      <Text style={[styles.choiceText, hasOpenings === choice.value && styles.selectedChoiceText]}>{choice.label}</Text>
                    </Pressable>
                  ))}
                </View>
                {hasOpenings && (
                  <View style={styles.section}>
                    <Text accessibilityRole="header" style={styles.sectionTitle}>Aberturas</Text>
                    {openings.map((opening, index) => (
                      <OpeningCard key={opening.id} opening={opening} index={index} errors={validation.openings[opening.id] ?? {}}
                        onChange={(update) => setOpenings((current) => current.map((item) => item.id === opening.id ? { ...item, ...update } : item))}
                        onRemove={() => setOpenings((current) => current.filter((item) => item.id !== opening.id))} />
                    ))}
                    {!!validation.openingsMessage && <Text style={styles.error}>{validation.openingsMessage}</Text>}
                    <Pressable accessibilityRole="button" onPress={addOpening} style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}>
                      <Text style={styles.addText}>+ Adicionar abertura</Text>
                    </Pressable>
                  </View>
                )}
              </View>
            )}

            {validation.areas && <AreaSummary areas={validation.areas} wall={service.id === 'wall'} />}
            {!!validation.areaMessage && <Text accessibilityRole="alert" style={styles.error}>{validation.areaMessage}</Text>}
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Pressable accessibilityRole="button" accessibilityState={{ disabled: !canContinue }} disabled={!canContinue}
            onPress={handleContinue} style={({ pressed }) => [styles.continueButton, !canContinue && styles.disabledButton, pressed && styles.pressed]}>
            <Text style={[styles.continueText, !canContinue && styles.disabledText]}>Continuar</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
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
  service: { color: Brand.primary, fontSize: 14, fontWeight: '600' },
  title: { color: Brand.dark, fontSize: 24, lineHeight: 32, fontWeight: '700' },
  subtitle: { color: '#60706A', fontSize: 14, lineHeight: 21 },
  dimensionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  section: { gap: 16 },
  sectionTitle: { color: Brand.dark, fontSize: 18, fontWeight: '700' },
  choiceRow: { flexDirection: 'row', gap: 12 },
  choice: { flex: 1, minHeight: 48, padding: 12, borderWidth: 1.5, borderColor: '#C5CECA', borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  selectedChoice: { borderColor: Brand.primary, backgroundColor: '#EDF7F1' },
  choiceText: { color: '#60706A', fontSize: 15 },
  selectedChoiceText: { color: Brand.primary, fontWeight: '700' },
  addButton: { minHeight: 50, padding: 14, borderWidth: 1.5, borderColor: Brand.primary, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  addText: { color: Brand.primary, fontSize: 15, fontWeight: '600' },
  error: { color: '#A33232', fontSize: 14, lineHeight: 21 },
  footer: { width: '100%', maxWidth: 640, alignSelf: 'center', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16 },
  continueButton: { minHeight: 56, padding: 16, borderRadius: 16, backgroundColor: Brand.primary, alignItems: 'center', justifyContent: 'center' },
  disabledButton: { backgroundColor: '#E2E8E5' },
  continueText: { color: Brand.white, fontSize: 18, fontWeight: '700', textAlign: 'center' },
  disabledText: { color: '#60706A' },
  pressed: { opacity: 0.8 },
  invalidService: { width: '100%', maxWidth: 640, alignSelf: 'center', padding: 24, gap: 20 },
});
