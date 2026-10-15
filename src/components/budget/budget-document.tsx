import { useState } from 'react';
import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';
import type { BudgetDocumentData } from '@/types/budget-document';
import { formatCompanySummary } from '@/utils/company-profile';
import { formatClientAddress, formatPhone } from '@/utils/client';
import { formatIssueDate } from '@/utils/budget-document';
import { formatBRL } from '@/utils/currency';
import { materialEstimateNotice } from '@/constants/budget-document';
import { Brand } from '@/constants/brand';
import { BudgetCard, BudgetLine } from './budget-card';

function DocumentLogo({ uri }: { uri: string }) {
  const [failed, setFailed] = useState(false);
  return failed ? null : <Image source={{ uri }} style={styles.logo} contentFit="contain" accessibilityLabel="Logo da empresa" onError={() => setFailed(true)} />;
}

export function BudgetDocument({ data }: { data: BudgetDocumentData }) {
  const companyLines = formatCompanySummary({ ...data.company, commercialNote: '' });
  const logo = data.company.logoUri;
  return <View style={styles.document}>
    <View style={styles.header}>
      {!!logo && (logo.startsWith('file://') || logo.startsWith('data:image/')) && <DocumentLogo key={logo} uri={logo} />}
      {companyLines.map((line, index) => <Text key={index} style={index === 0 ? styles.company : styles.text}>{line}</Text>)}
    </View>
    <Text accessibilityRole="header" style={styles.title}>ORÇAMENTO</Text>
    <Text style={styles.note}>Emissão: {formatIssueDate(data.issueDate)}</Text>
    <BudgetCard title="Cliente">
      <Text style={styles.text}>{data.client.name}</Text>
      {!!data.client.phone && <Text style={styles.text}>{formatPhone(data.client.phone)}</Text>}
      {formatClientAddress(data.client).map((line, index) => <Text key={index} style={styles.text}>{line}</Text>)}
      {!!data.client.complement && <Text style={styles.text}>Complemento: {data.client.complement}</Text>}
      {!!data.client.notes && <Text style={styles.text}>Observações: {data.client.notes}</Text>}
    </BudgetCard>
    <BudgetCard title="Serviço">
      <Text style={styles.service}>{data.serviceName}</Text>
      {[...data.measurements, ...data.configuration].map((item) => <BudgetLine key={item.label} label={item.label} value={item.value} />)}
    </BudgetCard>
    <BudgetCard title="Materiais estimados">
      {data.materials.map((item) => <BudgetLine key={item.label} label={item.label} value={item.value} />)}
    </BudgetCard>
    <BudgetCard title="Valores">
      <BudgetLine label="Valor dos materiais" value={formatBRL(data.pricing.materialsTotal)} />
      <BudgetLine label="Mão de obra" value={formatBRL(data.pricing.laborTotal)} />
      <View style={styles.total}><Text style={styles.service}>TOTAL</Text><Text style={styles.totalValue}>{formatBRL(data.pricing.total)}</Text></View>
    </BudgetCard>
    {!!data.notes && <BudgetCard title="Observações do orçamento"><Text style={styles.text}>{data.notes}</Text></BudgetCard>}
    {!!data.company.commercialNote && <BudgetCard title="Observação comercial"><Text style={styles.text}>{data.company.commercialNote}</Text></BudgetCard>}
    <Text style={styles.note}>{materialEstimateNotice}</Text>
  </View>;
}

const styles = StyleSheet.create({
  document: { gap: 16 }, header: { gap: 6, paddingBottom: 16, borderBottomWidth: 2, borderColor: Brand.dark },
  company: { color: Brand.dark, fontSize: 26, fontWeight: '700' }, title: { color: Brand.dark, fontSize: 23, fontWeight: '700' },
  service: { color: Brand.dark, fontSize: 16, fontWeight: '700' }, text: { color: Brand.dark, fontSize: 14, lineHeight: 22 },
  note: { color: '#60706A', fontSize: 13, lineHeight: 20 }, total: { backgroundColor: '#EAF3ED', padding: 16, borderRadius: 12, gap: 8 },
  totalValue: { color: Brand.primary, fontSize: 28, fontWeight: '700' }, logo: { width: '100%', maxWidth: 240, height: 80 },
});
