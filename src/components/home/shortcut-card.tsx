import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Brand } from '@/constants/brand';

type Props = { title: string; icon: SymbolViewProps['name']; onPress?: () => void };

export function ShortcutCard({ title, icon, onPress }: Props) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={title} onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View style={styles.icon}><SymbolView name={icon} size={27} tintColor={Brand.primary} /></View>
      <Text style={styles.title}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1, minWidth: 0, minHeight: 124, padding: 16, gap: 12, backgroundColor: Brand.white, borderColor: '#C5CECA', borderWidth: 2, borderRadius: 16, boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.05)' },
  pressed: { backgroundColor: '#EDF7F1', borderColor: Brand.accent, opacity: 0.85 },
  icon: { alignSelf: 'flex-start', padding: 9, backgroundColor: '#EDF7F1', borderRadius: 12 },
  title: { fontSize: 15, lineHeight: 21, fontWeight: '600', color: Brand.dark },
});
