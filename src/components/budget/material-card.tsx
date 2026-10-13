import { StyleSheet, Text, View } from 'react-native';
import { Brand } from '@/constants/brand';

type Props = { name: string; pieceLength: number; quantity: number };

export function MaterialCard({ name, pieceLength, quantity }: Props) {
  return (
    <View style={styles.card}>
      <Text accessibilityRole="header" style={styles.name}>{name}</Text>
      <Text style={styles.measure}>{pieceLength.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} m</Text>
      <Text style={styles.quantity}>Quantidade: {quantity.toLocaleString('pt-BR')} {quantity === 1 ? 'peça' : 'peças'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { padding: 16, gap: 10, borderWidth: 1.5, borderColor: '#C5CECA', borderRadius: 16, backgroundColor: Brand.white },
  name: { color: Brand.dark, fontSize: 18, lineHeight: 26, fontWeight: '700' },
  measure: { color: '#60706A', fontSize: 14, lineHeight: 21 },
  quantity: { color: Brand.primary, fontSize: 21, lineHeight: 30, fontWeight: '700' },
});
