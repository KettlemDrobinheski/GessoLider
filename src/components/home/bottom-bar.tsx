import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { StyleSheet, Text, View } from 'react-native';
import { Brand } from '@/constants/brand';

const items: { label: string; icon: SymbolViewProps['name'] }[] = [
  { label: 'Início', icon: { ios: 'house.fill', android: 'home', web: 'home' } },
  { label: 'Orçamentos', icon: { ios: 'doc.text', android: 'description', web: 'description' } },
  { label: 'Clientes', icon: { ios: 'person.2', android: 'group', web: 'group' } },
  { label: 'Mais', icon: { ios: 'ellipsis', android: 'more_horiz', web: 'more_horiz' } },
];

// Visual navigation only: no destinations are implemented in this stage.
export function BottomBar() {
  return (
    <View style={styles.bar}>
      <View style={styles.content}>
        {items.map((item, index) => (
          <View key={item.label} accessible accessibilityLabel={item.label}
            accessibilityState={{ selected: index === 0 }} style={styles.item}>
            <View style={[styles.icon, index === 0 && styles.selected]}>
              <SymbolView name={item.icon} size={23} tintColor={index === 0 ? Brand.primary : '#60706A'} />
            </View>
            <Text style={[styles.label, index === 0 && styles.selectedLabel]}>{item.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { borderTopWidth: 1, borderColor: '#DFE8E3', backgroundColor: Brand.white },
  content: { width: '100%', maxWidth: 640, alignSelf: 'center', flexDirection: 'row', paddingVertical: 8, paddingHorizontal: 8 },
  item: { flex: 1, minWidth: 0, alignItems: 'center', gap: 4 },
  icon: { paddingHorizontal: 16, paddingVertical: 5, borderRadius: 12 },
  selected: { backgroundColor: '#EDF7F1' },
  label: { color: '#60706A', fontSize: 11, textAlign: 'center' },
  selectedLabel: { color: Brand.primary, fontWeight: '700' },
});
