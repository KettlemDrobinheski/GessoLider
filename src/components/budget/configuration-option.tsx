import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Brand } from '@/constants/brand';

type Props = { label: string; description?: string; selected: boolean; onSelect: () => void };

export function ConfigurationOption({ label, description, selected, onSelect }: Props) {
  return (
    <Pressable accessibilityRole="radio" accessibilityLabel={description ? `${label}, ${description}` : label}
      accessibilityState={{ checked: selected }} aria-checked={selected} onPress={onSelect}
      style={({ pressed }) => [styles.option, selected && styles.selected, pressed && styles.pressed]}>
      <View style={styles.text}>
        <Text style={[styles.label, selected && styles.selectedLabel]}>{label}</Text>
        {!!description && <Text style={styles.description}>{description}</Text>}
      </View>
      <View style={[styles.radio, selected && styles.selectedRadio]}>
        {selected && <View style={styles.dot} />}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  option: { minHeight: 56, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1.5, borderColor: '#C5CECA', borderRadius: 12, backgroundColor: Brand.white },
  selected: { borderColor: Brand.primary, backgroundColor: '#EDF7F1' },
  pressed: { opacity: 0.8 },
  text: { flex: 1, minWidth: 0, gap: 5 },
  label: { color: Brand.dark, fontSize: 15, lineHeight: 22, fontWeight: '500' },
  selectedLabel: { color: Brand.primary, fontWeight: '700' },
  description: { color: '#60706A', fontSize: 13, lineHeight: 19 },
  radio: { width: 22, height: 22, borderWidth: 1.5, borderColor: '#C5CECA', borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  selectedRadio: { borderColor: Brand.primary },
  dot: { width: 12, height: 12, borderRadius: 6, backgroundColor: Brand.primary },
});
