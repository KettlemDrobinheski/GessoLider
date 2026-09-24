import { StatusBar } from 'expo-status-bar';
import { SymbolView } from 'expo-symbols';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BottomBar } from '@/components/home/bottom-bar';
import { RecentBudgetCard } from '@/components/home/recent-budget-card';
import { ShortcutCard } from '@/components/home/shortcut-card';
import { Brand } from '@/constants/brand';
import { mockRecentBudgets } from '@/mocks/recent-budgets';

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.greeting}>
              <Text accessibilityRole="header" style={styles.title}>Olá, Kettlem!</Text>
              <Text style={styles.subtitle}>Vamos construir grandes projetos hoje.</Text>
            </View>
            <Pressable disabled accessibilityRole="button" accessibilityLabel="Notificações"
              accessibilityState={{ disabled: true }} style={styles.notification}>
              <SymbolView name={{ ios: 'bell', android: 'notifications', web: 'notifications' }} size={25} tintColor={Brand.dark} />
            </Pressable>
          </View>

          <View style={styles.grid}>
            <View style={styles.row}>
              <ShortcutCard title="Novo Orçamento" icon={{ ios: 'doc.badge.plus', android: 'note_add', web: 'note_add' }} />
              <ShortcutCard title="Clientes" icon={{ ios: 'person.2', android: 'group', web: 'group' }} />
            </View>
            <View style={styles.row}>
              <ShortcutCard title="Minhas Obras" icon={{ ios: 'building.2', android: 'construction', web: 'construction' }} />
              <ShortcutCard title="Catálogo de Materiais" icon={{ ios: 'square.stack.3d.up', android: 'layers', web: 'layers' }} />
            </View>
          </View>

          <View style={styles.banner}>
            <View style={styles.blueprint} />
            <Text style={styles.bannerText}>Planeje, calcule e{'\n'}apresente orçamentos{'\n'}com mais profissionalismo.</Text>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text accessibilityRole="header" style={styles.sectionTitle}>Orçamentos recentes</Text>
              <Pressable disabled accessibilityRole="button" accessibilityState={{ disabled: true }} style={styles.seeAll}>
                <Text style={styles.link}>Ver todos</Text>
              </Pressable>
            </View>
            {mockRecentBudgets.map((budget) => <RecentBudgetCard key={budget.id} budget={budget} />)}
          </View>
        </View>
      </ScrollView>
      <BottomBar />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Brand.white },
  scroll: { flexGrow: 1, alignItems: 'center' },
  content: { width: '100%', maxWidth: 640, paddingHorizontal: 20, paddingTop: 24, paddingBottom: 24, gap: 24 },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  greeting: { flex: 1, minWidth: 0, gap: 8 },
  title: { fontSize: 26, fontWeight: '700', color: Brand.dark },
  subtitle: { fontSize: 14, lineHeight: 21, color: '#60706A' },
  notification: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#DFE8E3', borderRadius: 14 },
  grid: { gap: 12 },
  row: { flexDirection: 'row', gap: 12 },
  banner: { backgroundColor: Brand.dark, borderRadius: 18, padding: 20, overflow: 'hidden', justifyContent: 'center', minHeight: 144 },
  blueprint: { pointerEvents: 'none', position: 'absolute', right: -25, top: 15, width: 110, height: 140, borderWidth: 2, borderColor: Brand.accent, opacity: 0.18, transform: [{ rotate: '20deg' }] },
  bannerText: { color: Brand.white, fontSize: 18, lineHeight: 27, fontWeight: '600' },
  section: { gap: 12 },
  sectionHeader: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  sectionTitle: { fontSize: 19, fontWeight: '700', color: Brand.dark, flexShrink: 1 },
  seeAll: { minHeight: 44, justifyContent: 'center' },
  link: { fontSize: 13, fontWeight: '600', color: Brand.primary },
});
