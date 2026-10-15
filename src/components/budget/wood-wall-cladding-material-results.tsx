import { materialEstimateNotice } from '@/constants/budget-document';
import { StyleSheet, Text, View } from 'react-native';
import { boardDimensionLabel } from '@/constants/wall-configuration';
import { ceilingMaterials } from '@/constants/ceiling';
import type { WoodWallCladdingResult } from '@/domain/calculations/woodWallCladding';
import { MaterialCard, MaterialEstimateCard } from './material-card';

export function WoodWallCladdingMaterialResults({ result }: { result: WoodWallCladdingResult }) {
  if (result.status === 'invalid') return <Text accessibilityRole="alert" style={styles.note}>{result.message}</Text>;
  const measure = (value: number) => value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return (
    <View style={styles.container}>
      <MaterialCard name="Placa ST" measure={boardDimensionLabel} quantity={result.boards} unit="placa" />
      <MaterialEstimateCard name="Parafusos" estimate={`${result.screws.toLocaleString('pt-BR')} unidades estimadas`}
        note={`Caixa com ${ceilingMaterials.screwsPerBox.toLocaleString('pt-BR')} unidades — ${result.screwBoxes.toLocaleString('pt-BR')} ${result.screwBoxes === 1 ? 'caixa' : 'caixas'}.`} />
      <MaterialEstimateCard name="Fita para juntas" estimate={`${measure(result.tapeMeters)} m`} />
      <MaterialEstimateCard name="Massa para juntas" estimate={`${measure(result.compoundKg)} kg`} />
      <Text style={styles.note}>{materialEstimateNotice}</Text>
    </View>
  );
}

const styles = StyleSheet.create({ container: { gap: 16 }, note: { color: '#60706A', fontSize: 13, lineHeight: 20 } });
