import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { SavedBudget } from '@/types/saved-budget';
import { Brand } from '@/constants/brand';
import { formatBudgetHistoryDate, savedBudgetAmountLabel, savedBudgetServiceLabels, savedBudgetStatusLabels } from '@/utils/budget-history';

const statusColors = {
  draft: { backgroundColor: '#FFF5DE', color: '#795C13' },
  sent: { backgroundColor: '#EAF1FA', color: '#365D85' },
  approved: { backgroundColor: '#E7F5EC', color: Brand.primary },
  rejected: { backgroundColor: '#FBEAEA', color: '#9B3232' },
  completed: { backgroundColor: '#E7F5EC', color: Brand.primary },
} as const;

export function RecentBudgetCard({ budget, onPress }: { budget: SavedBudget; onPress: () => void }) {
  const colors = statusColors[budget.status];
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View style={styles.row}>
        <Text style={styles.title} numberOfLines={1}>{budget.client.name}</Text>
        <Text style={styles.amount}>{savedBudgetAmountLabel(budget)}</Text>
      </View>
      <Text style={styles.service}>{savedBudgetServiceLabels[budget.service]}</Text>
      <View style={styles.row}>
        <Text style={styles.date}>Atualizado em {formatBudgetHistoryDate(budget.updatedAt)}</Text>
        <View style={[styles.badge, { backgroundColor: colors.backgroundColor }]}>
          <Text style={[styles.status, { color: colors.color }]}>{savedBudgetStatusLabels[budget.status]}</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { padding: 16, gap: 8, borderRadius: 14, borderWidth: 1, borderColor: '#DFE8E3', backgroundColor: Brand.white },
  row: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  title: { color: Brand.dark, fontWeight: '600', fontSize: 15, flexShrink: 1 },
  amount: { color: Brand.primary, fontWeight: '700', fontSize: 14 },
  service: { color: '#60706A', fontSize: 13 },
  date: { color: '#60706A', fontSize: 12 },
  badge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  status: { fontSize: 12, fontWeight: '600' },
  pressed: { opacity: 0.8 },
});
