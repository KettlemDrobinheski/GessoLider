import { materialEstimateNotice } from '@/constants/budget-document';
import { StyleSheet, Text, View } from 'react-native';
import type { CeilingResult } from '@/domain/calculations/ceiling';
import { Brand } from '@/constants/brand';
import { MaterialCard, MaterialEstimateCard } from './material-card';

export function CeilingMaterialResults({ result }: { result: CeilingResult }) {
  if (result.status === 'invalid') return <Text accessibilityRole="alert" style={styles.note}>{result.message}</Text>;
  const measure = (value: number) => value.toLocaleString('pt-BR', { maximumFractionDigits: 2, minimumFractionDigits: 2 });
  return (
    <View style={styles.container}>
      <MaterialCard name="Placa ST" measure="1,20 × 1,80 m" quantity={result.boards} unit="placa" />
      <MaterialCard name="Perfil F530" measure="3 m" quantity={result.profiles}
        description={`${result.profileLines} linhas × ${result.profilesPerLine} peças por linha antes da perda.`} />
      <MaterialCard name="Cantoneira" measure="3 m" quantity={result.angles}
        description={`Peças por lado antes da perda (comprimento, largura, comprimento, largura): ${result.anglePiecesBySide.join(' + ')}.`} />
      <MaterialEstimateCard name="Parafuso G25 — caixa com 1.000 unidades"
        estimate={`Quantidade: ${result.screwBoxes.toLocaleString('pt-BR')} ${result.screwBoxes === 1 ? 'caixa' : 'caixas'}`}
        note={`Estimativa utilizada: ${result.screws.toLocaleString('pt-BR')} parafusos.`} />
      <MaterialEstimateCard name="Fita para juntas" estimate={`${measure(result.tapeMeters)} m`} />
      <MaterialEstimateCard name="Massa para juntas" estimate={`${measure(result.compoundKg)} kg`} />
      <Text style={styles.note}>F530 e cantoneiras são contados por trecho independente, sem reaproveitamento de sobras ou acréscimo para emendas e sobreposições.</Text>
      <Text style={styles.note}>{materialEstimateNotice}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 16 },
  note: { color: Brand.dark, fontSize: 13, lineHeight: 20 },
});
