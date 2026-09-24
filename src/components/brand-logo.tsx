import { StyleSheet, Text, View } from 'react-native';
import { Brand } from '@/constants/brand';

export function BrandLogo({ light = false }: { light?: boolean }) {
  const color = light ? Brand.white : Brand.dark;
  return (
    <View accessible accessibilityLabel="GessoLider" style={styles.container}>
      <Text style={[styles.roof, { color }]}>⌂</Text>
      <Text style={[styles.name, { color }]}>Gesso<Text style={{ color: Brand.accent }}>Lider</Text></Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center' },
  roof: { fontSize: 75, fontWeight: '300' },
  name: { fontSize: 38, fontWeight: '800', textAlign: 'center', letterSpacing: -1 },
});
