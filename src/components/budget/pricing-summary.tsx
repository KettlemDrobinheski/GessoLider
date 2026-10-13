import { StyleSheet, Text, View } from 'react-native';
import { Brand } from '@/constants/brand';
import type { WallPricing } from '@/types/wall-pricing';
import { formatBRL } from '@/utils/currency';
import { formatArea } from '@/utils/measurements';
import { BudgetCard, BudgetLine } from './budget-card';

export function PricingSummary({ pricing }: { pricing: WallPricing }) {
  return (
    <BudgetCard title="Valores">
      <BudgetLine label="Área para mão de obra" value={formatArea(pricing.billingArea)} />
      <BudgetLine label="Valor/m²" value={formatBRL(pricing.laborRate)} />
      <BudgetLine label="Mão de obra" value={formatBRL(pricing.laborTotal)} />
      <BudgetLine label="Materiais" value={formatBRL(pricing.materialsTotal)} />
      <View style={styles.total}>
        <Text style={styles.label}>TOTAL</Text>
        <Text style={styles.amount}>{formatBRL(pricing.total)}</Text>
      </View>
    </BudgetCard>
  );
}

const styles = StyleSheet.create({
  total: { backgroundColor: '#EDF7F1', padding: 16, borderRadius: 12, gap: 8 },
  label: { color: Brand.dark, fontSize: 15, fontWeight: '700' },
  amount: { color: Brand.primary, fontSize: 28, lineHeight: 36, fontWeight: '800' },
});
