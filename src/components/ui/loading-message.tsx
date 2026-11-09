import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Brand } from '@/constants/brand';

export function LoadingMessage({ label }: { label: string }) {
  return <View style={styles.container}>
    <ActivityIndicator size="small" color={Brand.primary} />
    <Text style={styles.label}>{label}</Text>
  </View>;
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  label: { color: '#60706A', fontSize: 14, lineHeight: 21 },
});
