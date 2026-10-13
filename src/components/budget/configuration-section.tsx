import type { PropsWithChildren } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Brand } from '@/constants/brand';

export function ConfigurationSection({ title, children }: PropsWithChildren<{ title: string }>) {
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel={title} style={styles.section}>
      <Text accessibilityRole="header" style={styles.title}>{title}</Text>
      <View style={styles.options}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: 12 },
  title: { color: Brand.dark, fontSize: 18, fontWeight: '700' },
  options: { gap: 10 },
});
