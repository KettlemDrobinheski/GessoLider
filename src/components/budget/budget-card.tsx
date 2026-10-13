import type { PropsWithChildren } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Brand } from '@/constants/brand';

export function BudgetCard({ title, children }: PropsWithChildren<{ title: string }>) {
  return <View style={styles.card}><Text accessibilityRole="header" style={styles.title}>{title}</Text>{children}</View>;
}

export function BudgetLine({ label, value }: { label: string; value: string }) {
  return <Text style={styles.line}><Text style={styles.label}>{label}: </Text>{value}</Text>;
}

const styles = StyleSheet.create({
  card: { padding: 16, gap: 12, borderWidth: 1.5, borderColor: '#C5CECA', borderRadius: 16, backgroundColor: Brand.white },
  title: { color: Brand.dark, fontSize: 19, lineHeight: 27, fontWeight: '700' },
  line: { color: Brand.dark, fontSize: 14, lineHeight: 22 },
  label: { fontWeight: '600' },
});
