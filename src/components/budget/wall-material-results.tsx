import { StyleSheet, Text, View } from 'react-native';
import { Brand } from '@/constants/brand';
import { boardOptions, insulationOptions } from '@/constants/wall-configuration';
import { formatArea } from '@/utils/measurements';
import type { WallMaterialsResult } from '@/domain/calculations/wallMaterials';
import type { WallProfilesUnsupportedReason } from '@/domain/calculations/wallProfiles';
import { MaterialCard, MaterialEstimateCard } from './material-card';

const unsupportedMessages: Record<WallProfilesUnsupportedReason, string> = {
  'height-above-3m': 'Paredes com altura superior a 3 m ainda não são suportadas.',
  'openings-require-additional-rules': 'Portas e janelas exigem regras adicionais antes de calcular os perfis.',
};

function formatMeasure(value: number) {
  return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function WallMaterialResults({ result }: { result: WallMaterialsResult }) {
  if (result.status === 'valid') {
    return (
      <View style={styles.container}>
        <Text accessibilityRole="header" style={styles.sectionTitle}>Placas</Text>
        <MaterialCard name="Placa de drywall" description={boardOptions.find((option) => option.value === result.boards.type)?.label}
          measure={`${formatMeasure(result.boards.dimensions.width)} × ${formatMeasure(result.boards.dimensions.height)} m`}
          quantity={result.boards.quantity} unit="placa" />
        <Text accessibilityRole="header" style={styles.sectionTitle}>Estrutura metálica</Text>
        <MaterialCard name={`Guia ${result.guides.width} mm`} measure={`${formatMeasure(result.guides.pieceLength)} m`} quantity={result.guides.quantity} />
        <MaterialCard name={`Montante ${result.studs.width} mm`} measure={`${formatMeasure(result.studs.pieceLength)} m`}
          description={`Espaçamento: ${result.studs.spacingCm} cm`} quantity={result.studs.quantity} />
        <Text accessibilityRole="header" style={styles.sectionTitle}>Fixação</Text>
        <MaterialEstimateCard name="Parafusos para placas" estimate={`Quantidade estimada: ${result.consumables.boardScrews.quantity.toLocaleString('pt-BR')} unidades`} />
        {result.consumables.metalScrews.status === 'to-define' && (
          <MaterialEstimateCard name="Parafusos metal-metal" estimate="Quantidade a definir" />
        )}
        <Text accessibilityRole="header" style={styles.sectionTitle}>Acabamento</Text>
        <MaterialEstimateCard name="Fita para juntas" estimate={`Quantidade estimada: ${formatMeasure(result.consumables.jointTape.meters)} m`} />
        <MaterialEstimateCard name="Massa para tratamento de juntas" estimate={`Quantidade estimada: ${formatMeasure(result.consumables.jointCompound.kilograms)} kg`} />
        {result.insulation && (
          <>
            <Text accessibilityRole="header" style={styles.sectionTitle}>Isolamento</Text>
            <MaterialEstimateCard name={insulationOptions.find((option) => option.value === result.insulation?.type)?.label ?? ''}
              estimate={`Área estimada: ${formatArea(result.insulation.areaWithWaste)}`}
              note="Área interna da parede, sem conversão para rolos, pacotes ou placas." />
          </>
        )}
        {result.consumables.acousticBand && (
          <>
            <Text accessibilityRole="header" style={styles.sectionTitle}>Acessórios</Text>
            <MaterialEstimateCard name="Banda acústica" estimate={`Quantidade estimada: ${formatMeasure(result.consumables.acousticBand.meters)} m`}
              note="Estimativa por área, sem levantamento linear detalhado dos encontros da parede." />
          </>
        )}
        <Text style={styles.note}>As quantidades são estimativas baseadas nas medidas e configurações informadas. O consumo real pode variar conforme o sistema de instalação, recortes, paginação e condições da obra.</Text>
        <Text style={styles.note}>As guias são estimadas pela metragem total, sem plano de corte das peças.</Text>
      </View>
    );
  }

  return (
    <View accessibilityRole="alert" style={styles.messageCard}>
      <Text style={styles.messageTitle}>
        {result.status === 'unsupported' ? 'Esta configuração ainda precisa de cálculo específico.' : 'Revise os dados da parede para calcular os materiais.'}
      </Text>
      {result.status === 'unsupported'
        ? result.reasons.map((reason) => <Text key={reason} style={styles.message}>{unsupportedMessages[reason]}</Text>)
        : result.errors.map((error) => <Text key={`${error.field}-${error.code}`} style={styles.message}>{error.message}</Text>)}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 16 },
  sectionTitle: { color: Brand.dark, fontSize: 19, lineHeight: 27, fontWeight: '700' },
  note: { color: '#60706A', fontSize: 13, lineHeight: 20 },
  messageCard: { padding: 16, gap: 12, borderWidth: 1.5, borderColor: Brand.accent, borderRadius: 16, backgroundColor: '#EDF7F1' },
  messageTitle: { color: Brand.dark, fontSize: 18, lineHeight: 26, fontWeight: '700' },
  message: { color: '#60706A', fontSize: 14, lineHeight: 21 },
});
