import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { Link, usePathname } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Brand } from '@/constants/brand';
import { useResponsiveLayout } from '@/hooks/use-responsive-layout';

const items: { label: string; href: '/home' | '/orcamentos' | '/configuracoes/empresa'; icon: SymbolViewProps['name'] }[] = [
  { label: 'Início', href: '/home', icon: { ios: 'house.fill', android: 'home', web: 'home' } },
  { label: 'Orçamentos', href: '/orcamentos', icon: { ios: 'doc.text', android: 'description', web: 'description' } },
  { label: 'Empresa', href: '/configuracoes/empresa', icon: { ios: 'building.2', android: 'business', web: 'business' } },
];

export function BottomBar() {
  const pathname = usePathname();
  const { maxContentWidth } = useResponsiveLayout();

  return (
    <View style={styles.bar}>
      <View style={[styles.content, { maxWidth: maxContentWidth }]}>
        {items.map((item) => {
          const selected = pathname === item.href;
          return (
            <Link key={item.href} href={item.href} asChild>
              <Pressable accessibilityLabel={item.label} accessibilityState={{ selected }}
                style={({ pressed }) => [styles.item, pressed && styles.pressed]}>
                <View style={[styles.icon, selected && styles.selected]}>
                  <SymbolView name={item.icon} size={23} tintColor={selected ? Brand.primary : '#60706A'} />
                </View>
                <Text style={[styles.label, selected && styles.selectedLabel]}>{item.label}</Text>
              </Pressable>
            </Link>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { borderTopWidth: 1, borderColor: '#DFE8E3', backgroundColor: Brand.white },
  content: { width: '100%', alignSelf: 'center', flexDirection: 'row', paddingVertical: 8, paddingHorizontal: 8 },
  item: { flex: 1, minWidth: 0, alignItems: 'center', justifyContent: 'center', gap: 4, minHeight: 48 },
  pressed: { opacity: 0.72 },
  icon: { paddingHorizontal: 16, paddingVertical: 5, borderRadius: 12 },
  selected: { backgroundColor: '#EDF7F1' },
  label: { color: '#60706A', fontSize: 11, textAlign: 'center' },
  selectedLabel: { color: Brand.primary, fontWeight: '700' },
});
