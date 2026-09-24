import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Brand } from '@/constants/brand';
import type { ServiceOption, ServiceType } from '@/constants/services';

type Props = {
  service: ServiceOption;
  selected: boolean;
  onSelect: (service: ServiceType) => void;
};

export function ServiceCard({ service, selected, onSelect }: Props) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityLabel={`${service.title}. ${service.description}`}
      accessibilityState={{ checked: selected }}
      aria-checked={selected}
      onPress={() => onSelect(service.id)}
      style={({ pressed }) => [styles.card, selected && styles.selected, pressed && styles.pressed]}>
      <View style={styles.icon}>
        <SymbolView name={service.icon} size={28} tintColor={Brand.primary} />
      </View>
      <View style={styles.copy}>
        <Text style={styles.title}>{service.title}</Text>
        <Text style={styles.description}>{service.description}</Text>
      </View>
      <View style={[styles.indicator, selected && styles.checked]}>
        {selected && <Text style={styles.checkmark}>✓</Text>}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16,
    minHeight: 104, borderWidth: 2, borderColor: '#C5CECA', borderRadius: 16,
    backgroundColor: Brand.white, boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.05)',
  },
  selected: { borderColor: Brand.primary, backgroundColor: '#EDF7F1' },
  pressed: { opacity: 0.8 },
  icon: { padding: 10, borderRadius: 12, backgroundColor: '#EDF7F1' },
  copy: { flex: 1, minWidth: 0, gap: 5 },
  title: { color: Brand.dark, fontSize: 16, lineHeight: 22, fontWeight: '700' },
  description: { color: '#60706A', fontSize: 13, lineHeight: 19 },
  indicator: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: '#C5CECA', alignItems: 'center', justifyContent: 'center' },
  checked: { backgroundColor: Brand.primary, borderColor: Brand.primary },
  checkmark: { color: Brand.white, fontSize: 14, fontWeight: '700' },
});
