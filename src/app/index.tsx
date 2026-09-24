import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <View style={styles.content}>
        <View style={styles.logo}>
          <Text style={styles.logoRoof}>⌂</Text>
        </View>

        <Text style={styles.name}>
          Gesso<Text style={styles.nameAccent}>Lider</Text>
        </Text>

        <Text style={styles.subtitle}>
          Soluções em drywall{"\n"}para seus projetos
        </Text>

        <View style={styles.features}>
          <Feature text="Calcule materiais" />
          <Feature text="Monte orçamentos" />
          <Feature text="Organize suas obras" />
          <Feature text="Resultados precisos" />
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.button}
          activeOpacity={0.8}
          onPress={() => {
            console.log("Começar");
          }}
        >
          <Text style={styles.buttonText}>Começar</Text>
        </TouchableOpacity>

        <Text style={styles.footerText}>
          Mais praticidade do{"\n"}planejamento à entrega.
        </Text>
      </View>
    </View>
  );
}

function Feature({ text }: { text: string }) {
  return (
    <View style={styles.feature}>
      <View style={styles.check}>
        <Text style={styles.checkText}>✓</Text>
      </View>

      <Text style={styles.featureText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#123D35",
    paddingHorizontal: 28,
    paddingTop: 80,
    paddingBottom: 40,
  },

  content: {
    flex: 1,
    justifyContent: "center",
  },

  logo: {
    alignItems: "center",
    marginBottom: 5,
  },

  logoRoof: {
    color: "#FFFFFF",
    fontSize: 75,
    fontWeight: "300",
  },

  name: {
    color: "#FFFFFF",
    fontSize: 38,
    fontWeight: "800",
    textAlign: "center",
    letterSpacing: -1,
  },

  nameAccent: {
    color: "#55C59A",
  },

  subtitle: {
    color: "#FFFFFF",
    fontSize: 18,
    textAlign: "center",
    lineHeight: 26,
    marginTop: 12,
    opacity: 0.9,
  },

  features: {
    marginTop: 50,
    gap: 18,
  },

  feature: {
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
  },

  check: {
    width: 24,
    height: 24,
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
    borderRadius: 5,
    alignItems: "center",
    justifyContent: "center",
  },

  checkText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },

  featureText: {
    color: "#FFFFFF",
    fontSize: 16,
  },

  footer: {
    gap: 18,
  },

  button: {
    backgroundColor: "#087354",
    height: 58,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#40A987",
  },

  buttonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },

  footerText: {
    color: "#FFFFFF",
    textAlign: "center",
    fontSize: 14,
    lineHeight: 19,
    opacity: 0.8,
  },
});
