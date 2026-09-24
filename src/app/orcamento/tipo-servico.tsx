import { useState } from 'react';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SymbolView } from 'expo-symbols';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BudgetSteps } from '@/components/budget/budget-steps';
import { ServiceCard } from '@/components/budget/service-card';
import { Brand } from '@/constants/brand';
import { serviceOptions, type ServiceType } from '@/constants/services';

export default function ServiceTypeScreen() {
  const [selectedService, setSelectedService] = useState<ServiceType | null>(null);

  function handleBack() {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/home');
    }
  }

  function handleContinue() {
    if (selectedService === null) return;
    router.push({ pathname: '/orcamento/medidas', params: { servico: selectedService } });
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

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.content}>
          <BudgetSteps activeStep={1} />
          <View style={styles.introduction}>
            <Text accessibilityRole="header" style={styles.title}>Qual serviço será realizado?</Text>
            <Text style={styles.subtitle}>Selecione uma opção para continuar.</Text>
          </View>
          <View accessibilityRole="radiogroup" accessibilityLabel="Tipo de serviço" style={styles.services}>
            {serviceOptions.map((service) => (
              <ServiceCard key={service.id} service={service}
                selected={selectedService === service.id} onSelect={setSelectedService} />
            ))}
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable accessibilityRole="button" accessibilityState={{ disabled: selectedService === null }}
          disabled={selectedService === null} onPress={handleContinue}
          style={({ pressed }) => [styles.continueButton, selectedService === null && styles.disabledButton, pressed && styles.pressed]}>
          <Text style={[styles.continueText, selectedService === null && styles.disabledText]}>Continuar</Text>
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
  scroll: { flexGrow: 1, alignItems: 'center' },
  content: { width: '100%', maxWidth: 640, padding: 20, gap: 28 },
  introduction: { gap: 8 },
  title: { color: Brand.dark, fontSize: 24, lineHeight: 32, fontWeight: '700' },
  subtitle: { color: '#60706A', fontSize: 14, lineHeight: 21 },
  services: { gap: 12 },
  footer: { width: '100%', maxWidth: 640, alignSelf: 'center', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16 },
  continueButton: { minHeight: 56, padding: 16, borderRadius: 16, backgroundColor: Brand.primary, alignItems: 'center', justifyContent: 'center' },
  disabledButton: { backgroundColor: '#E2E8E5' },
  continueText: { color: Brand.white, fontSize: 18, fontWeight: '700', textAlign: 'center' },
  disabledText: { color: '#60706A' },
  pressed: { opacity: 0.8 },
});
