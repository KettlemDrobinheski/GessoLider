import { StyleSheet, Text, View } from 'react-native';
import { Brand } from '@/constants/brand';

export type RecentBudget = {
  id: string;
  title: string;
  service: string;
  dateLabel: string;
  amountLabel: string;
  status: 'Em edição' | 'Enviado' | 'Concluído';
};

const statusColors = {
  'Em edição': { backgroundColor: '#FFF5DE', color: '#795C13' },
  Enviado: { backgroundColor: '#EAF1FA', color: '#365D85' },
  Concluído: { backgroundColor: '#E7F5EC', color: Brand.primary },
};

export function RecentBudgetCard({ budget }: { budget: RecentBudget }) {
  const colors = statusColors[budget.status];
  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <Text style={styles.title}>{budget.title}</Text>
        <Text style={styles.amount}>{budget.amountLabel}</Text>
      </View>
      <Text style={styles.service}>{budget.service}</Text>
      <View style={styles.row}>
        <Text style={styles.date}>{budget.dateLabel}</Text>
        <View style={[styles.badge, { backgroundColor: colors.backgroundColor }]}>
          <Text style={[styles.status, { color: colors.color }]}>{budget.status}</Text>
        </View>
      </View>
    </View>
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
});
