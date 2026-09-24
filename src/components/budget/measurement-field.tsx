import { useId, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { Brand } from '@/constants/brand';

type Props = {
  label: string;
  accessibilityLabel?: string;
  value: string;
  onChangeText: (value: string) => void;
  error?: string;
  integer?: boolean;
};

export function MeasurementField({ label, accessibilityLabel, value, onChangeText, error, integer = false }: Props) {
  const [touched, setTouched] = useState(false);
  const id = useId();
  const visibleError = (touched || value.length > 0) ? error : undefined;
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputRow, visibleError && styles.invalid]}>
        <TextInput
          accessibilityLabel={accessibilityLabel ?? label} aria-invalid={!!visibleError}
          aria-describedby={visibleError ? id : undefined}
          value={value} onChangeText={onChangeText} onBlur={() => setTouched(true)}
          keyboardType={integer ? 'number-pad' : 'decimal-pad'} inputMode={integer ? 'numeric' : 'decimal'}
          autoCorrect={false} autoCapitalize="none" placeholder={integer ? '1' : '0,00'}
          placeholderTextColor="#60706A" style={styles.input} returnKeyType="done"
        />
        {!integer && <Text style={styles.unit}>m</Text>}
      </View>
      {!!visibleError && <Text nativeID={id} style={styles.error}>{visibleError}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  field: { flexGrow: 1, flexBasis: 120, minWidth: 0, gap: 8 },
  label: { color: Brand.dark, fontSize: 15, fontWeight: '600' },
  inputRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: '#C5CECA', borderRadius: 12, backgroundColor: Brand.white },
  input: { flex: 1, minWidth: 0, minHeight: 54, paddingHorizontal: 14, paddingVertical: 12, color: Brand.dark, fontSize: 17 },
  unit: { color: '#60706A', fontSize: 15, paddingRight: 14 },
  invalid: { borderColor: '#A33232' },
  error: { color: '#A33232', fontSize: 12, lineHeight: 18 },
});
