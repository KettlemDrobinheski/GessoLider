import { StyleSheet, Text, View } from 'react-native';
import { Brand } from '@/constants/brand';
import type { WallProfilesResult, WallProfilesUnsupportedReason } from '@/domain/calculations/wallProfiles';
import type { ProfileWidth } from '@/types/wall-configuration';
import { MaterialCard } from './material-card';

const unsupportedMessages: Record<WallProfilesUnsupportedReason, string> = {
  'height-above-3m': 'Paredes com altura superior a 3 m ainda não são suportadas.',
  'openings-require-additional-rules': 'Portas e janelas exigem regras adicionais antes de calcular os perfis.',
};

export function WallProfileResults({ result, profileWidth }: { result: WallProfilesResult; profileWidth: ProfileWidth }) {
  if (result.status === 'valid') {
    return (
      <View style={styles.container}>
        <MaterialCard name={`Guia ${profileWidth} mm`} pieceLength={result.guides.pieceLength} quantity={result.guides.quantity} />
        <MaterialCard name={`Montante ${profileWidth} mm`} pieceLength={result.studs.pieceLength} quantity={result.studs.quantity} />
        <Text style={styles.note}>Estimativa inicial de perfis. Outros materiais serão adicionados ao cálculo nas próximas etapas.</Text>
        <Text style={styles.note}>As guias são estimadas pela metragem total, sem plano de corte das peças.</Text>
      </View>
    );
  }

  return (
    <View accessibilityRole="alert" style={styles.messageCard}>
      <Text style={styles.messageTitle}>
        {result.status === 'unsupported' ? 'Esta configuração ainda precisa de cálculo específico.' : 'Revise os dados da parede para calcular os perfis.'}
      </Text>
      {result.status === 'unsupported'
        ? result.reasons.map((reason) => <Text key={reason} style={styles.message}>{unsupportedMessages[reason]}</Text>)
        : result.errors.map((error) => <Text key={`${error.field}-${error.code}`} style={styles.message}>{error.message}</Text>)}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 16 },
  note: { color: '#60706A', fontSize: 13, lineHeight: 20 },
  messageCard: { padding: 16, gap: 12, borderWidth: 1.5, borderColor: Brand.accent, borderRadius: 16, backgroundColor: '#EDF7F1' },
  messageTitle: { color: Brand.dark, fontSize: 18, lineHeight: 26, fontWeight: '700' },
  message: { color: '#60706A', fontSize: 14, lineHeight: 21 },
});
