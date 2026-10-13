import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { Brand } from '@/constants/brand';
import { formatCurrencyInput, parseCurrencyInput } from '@/utils/currency';

type Props = { label: string; value: string; onChangeText: (value: string) => void; error?: string };

export function CurrencyField({ label, value, onChangeText, error }: Props) {
  const [touched, setTouched] = useState(false);
  const visibleError = touched || value.length > 0 ? error : undefined;

  function handleBlur() {
    setTouched(true);
    const parsed = parseCurrencyInput(value);
    if (parsed !== null) onChangeText(formatCurrencyInput(parsed));
  }

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.row, visibleError && styles.invalid]}>
        <Text style={styles.prefix}>R$</Text>
        <TextInput accessibilityLabel={label} aria-invalid={!!visibleError} value={value} onChangeText={onChangeText}
          onBlur={handleBlur} keyboardType="decimal-pad" inputMode="decimal" autoCorrect={false} autoCapitalize="none"
          placeholder="0,00" placeholderTextColor="#60706A" style={styles.input} />
      </View>
      {!!visibleError && <Text style={styles.error}>{visibleError}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: 8 },
  label: { color: Brand.dark, fontSize: 15, lineHeight: 22, fontWeight: '600' },
  row: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: '#C5CECA', borderRadius: 12 },
  prefix: { color: '#60706A', fontSize: 16, paddingLeft: 14 },
  input: { flex: 1, minWidth: 0, minHeight: 54, padding: 14, fontSize: 17, color: Brand.dark },
  invalid: { borderColor: '#A33232' },
  error: { color: '#A33232', fontSize: 12, lineHeight: 18 },
});
