import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Brand } from '@/constants/brand';
import type { OpeningDraft, OpeningErrors, OpeningType } from '@/types/measurements';
import { MeasurementField } from './measurement-field';

type Props = {
  opening: OpeningDraft;
  index: number;
  errors: OpeningErrors;
  onChange: (update: Partial<Omit<OpeningDraft, 'id'>>) => void;
  onRemove: () => void;
};

const openingTypes: { value: OpeningType; label: string }[] = [
  { value: 'door', label: 'Porta' }, { value: 'window', label: 'Janela' },
];

export function OpeningCard({ opening, index, errors, onChange, onRemove }: Props) {
  const title = `Abertura ${index + 1}`;
  return (
    <View style={styles.card}>
      <View style={styles.heading}>
        <Text style={styles.title}>{title}</Text>
        <Pressable accessibilityRole="button" accessibilityLabel={`Remover ${title.toLowerCase()}`}
          onPress={onRemove} style={({ pressed }) => [styles.remove, pressed && styles.pressed]}>
          <Text style={styles.removeText}>Remover</Text>
        </Pressable>
      </View>
      <View accessibilityRole="radiogroup" accessibilityLabel={`Tipo da ${title.toLowerCase()}`} style={styles.row}>
        {openingTypes.map((type) => (
          <Pressable key={type.value} accessibilityRole="radio" aria-checked={opening.type === type.value}
            accessibilityState={{ checked: opening.type === type.value }} onPress={() => onChange({ type: type.value })}
            style={({ pressed }) => [styles.option, opening.type === type.value && styles.selected, pressed && styles.pressed]}>
            <Text style={[styles.optionText, opening.type === type.value && styles.selectedText]}>{type.label}</Text>
          </Pressable>
        ))}
      </View>
      <View style={styles.row}>
        <MeasurementField label="Largura" accessibilityLabel={`${title}: largura`} value={opening.width} error={errors.width} onChangeText={(width) => onChange({ width })} />
        <MeasurementField label="Altura" accessibilityLabel={`${title}: altura`} value={opening.height} error={errors.height} onChangeText={(height) => onChange({ height })} />
      </View>
      <View style={styles.row}>
        <MeasurementField label="Quantidade" accessibilityLabel={`${title}: quantidade`} integer value={opening.quantity} error={errors.quantity} onChangeText={(quantity) => onChange({ quantity })} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { padding: 16, gap: 16, backgroundColor: Brand.white, borderWidth: 2, borderColor: '#C5CECA', borderRadius: 16 },
  heading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 },
  title: { color: Brand.dark, fontSize: 16, fontWeight: '700' },
  remove: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 4 },
  removeText: { color: Brand.primary, fontSize: 13, fontWeight: '600' },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  option: { flex: 1, minHeight: 48, padding: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#C5CECA', borderRadius: 10 },
  selected: { borderColor: Brand.primary, backgroundColor: '#EDF7F1' },
  optionText: { color: '#60706A', fontSize: 14 },
  selectedText: { color: Brand.primary, fontWeight: '700' },
  pressed: { opacity: 0.8 },
});
