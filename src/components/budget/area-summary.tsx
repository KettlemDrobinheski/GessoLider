import { StyleSheet, Text, View } from 'react-native';
import { Brand } from '@/constants/brand';
import type { AreaSummary as Areas } from '@/types/measurements';
import { formatArea } from '@/utils/measurements';

export function AreaSummary({ areas, wall }: { areas: Areas; wall: boolean }) {
  const rows = wall
    ? [{ label: 'Área bruta da parede', value: areas.gross }, { label: 'Área total das aberturas', value: areas.openings }, { label: 'Área útil', value: areas.net }]
    : [{ label: 'Área informada', value: areas.gross }];
  return (
    <View style={styles.card}>
      {rows.map((row) => (
        <View key={row.label} style={styles.row}>
          <Text style={styles.label}>{row.label}</Text>
          <Text style={styles.value}>{formatArea(row.value)}</Text>
        </View>
      ))}
      <Text style={styles.note}>Área geométrica, sem cálculo de materiais.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { padding: 16, gap: 14, borderWidth: 1, borderColor: Brand.accent, borderRadius: 16, backgroundColor: '#EDF7F1' },
  row: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  label: { color: Brand.dark, fontSize: 14, flexShrink: 1 },
  value: { color: Brand.primary, fontSize: 17, fontWeight: '700', flexShrink: 1 },
  note: { color: '#60706A', fontSize: 12, lineHeight: 18 },
});
