import { StyleSheet, Text, View } from 'react-native';
import { Brand } from '@/constants/brand';

type Props = { name: string; measure: string; description?: string; quantity: number; unit?: 'peça' | 'placa' };

export function MaterialCard({ name, measure, description, quantity, unit = 'peça' }: Props) {
  return (
    <View style={styles.card}>
      <Text accessibilityRole="header" style={styles.name}>{name}</Text>
      {!!description && <Text style={styles.measure}>{description}</Text>}
      <Text style={styles.measure}>{measure}</Text>
      <Text style={styles.quantity}>Quantidade: {quantity.toLocaleString('pt-BR')} {quantity === 1 ? unit : `${unit}s`}</Text>
    </View>
  );
}

export function MaterialEstimateCard({ name, estimate, note }: { name: string; estimate: string; note?: string }) {
  return (
    <View style={styles.card}>
      <Text accessibilityRole="header" style={styles.name}>{name}</Text>
      <Text style={styles.quantity}>{estimate}</Text>
      {!!note && <Text style={styles.measure}>{note}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { padding: 16, gap: 10, borderWidth: 1.5, borderColor: '#C5CECA', borderRadius: 16, backgroundColor: Brand.white },
  name: { color: Brand.dark, fontSize: 18, lineHeight: 26, fontWeight: '700' },
  measure: { color: '#60706A', fontSize: 14, lineHeight: 21 },
  quantity: { color: Brand.primary, fontSize: 21, lineHeight: 30, fontWeight: '700' },
});
