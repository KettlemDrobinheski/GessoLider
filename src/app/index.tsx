import { BrandLogo } from "@/components/brand-logo";
import { Brand } from "@/constants/brand";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalAccess } from "@/hooks/use-local-access";

const benefits = [
  "Calcule materiais",
  "Monte orçamentos",
  "Organize suas obras",
  "Resultados precisos",
];

export default function SplashScreen() {
  const { active, ready } = useLocalAccess();
  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.container}>
          <View style={styles.content}>
            <BrandLogo light />
            <Text style={styles.subtitle}>
              Soluções em drywall{"\n"}para seus projetos
            </Text>
            <View style={styles.features}>
              {benefits.map((benefit) => (
                <View key={benefit} style={styles.feature}>
                  <View style={styles.check}>
                    <Text style={styles.checkText}>✓</Text>
                  </View>
                  <Text style={styles.featureText}>{benefit}</Text>
                </View>
              ))}
            </View>
          </View>
          <View style={styles.footer}>
            <Pressable accessibilityRole="button" disabled={!ready}
              onPress={() => router.replace(active ? '/home' : '/login')}
              style={[styles.button, !ready && styles.disabledButton]}>
              <Text style={styles.buttonText}>{ready ? 'Começar' : 'Carregando…'}</Text>
            </Pressable>
            <Text style={styles.footerText}>
              Mais praticidade do{"\n"}planejamento à entrega.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Brand.dark },
  scroll: { flexGrow: 1, alignItems: "center" },
  container: {
    flexGrow: 1,
    width: "100%",
    maxWidth: 480,
    paddingHorizontal: 28,
    paddingVertical: 24,
  },
  content: { flexGrow: 1, justifyContent: "center", paddingVertical: 24 },
  subtitle: {
    color: Brand.white,
    fontSize: 18,
    textAlign: "center",
    lineHeight: 26,
    marginTop: 12,
  },
  features: { marginTop: 40, gap: 18, alignSelf: "center" },
  feature: { flexDirection: "row", alignItems: "center", gap: 13 },
  check: {
    width: 24,
    height: 24,
    borderWidth: 1.5,
    borderColor: Brand.white,
    borderRadius: 5,
    alignItems: "center",
    justifyContent: "center",
  },
  checkText: { color: Brand.white, fontSize: 16, fontWeight: "700" },
  featureText: { color: Brand.white, fontSize: 16, flexShrink: 1 },
  footer: { gap: 18, paddingTop: 24 },
  button: {
    width: "100%",
    alignSelf: "center",
    backgroundColor: Brand.primary,
    minHeight: 56,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Brand.accent,
  },
  buttonText: { color: Brand.white, fontSize: 18, fontWeight: "700", textAlign: "center" },
  disabledButton: { opacity: 0.65 },
  footerText: {
    color: Brand.white,
    textAlign: "center",
    fontSize: 14,
    lineHeight: 19,
  },
});
