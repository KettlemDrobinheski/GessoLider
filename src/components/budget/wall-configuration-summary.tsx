import { StyleSheet, Text, View } from 'react-native';
import { Brand } from '@/constants/brand';
import { boardDimensionLabel, boardOptions, insulationOptions, profileLengthLabel, sidesOptions, studSpacingOptions, wasteOptions } from '@/constants/wall-configuration';
import type { WallConfigurationDraft } from '@/types/wall-configuration';

export function WallConfigurationSummary({ draft }: { draft: WallConfigurationDraft }) {
  const board = boardOptions.find((option) => option.value === draft.boardType);
  const sides = sidesOptions.find((option) => option.value === draft.sides);
  const spacing = studSpacingOptions.find((option) => option.value === draft.studSpacingCm);
  const waste = wasteOptions.find((option) => option.value === draft.wastePercent);
  const insulation = insulationOptions.find((option) => option.value === draft.insulationType);
  const profile = draft.profileWidth === null ? 'Não selecionado' : `${draft.profileWidth} mm`;
  const rows = [
    { label: 'Placa', value: board ? `${board.label} — ${boardDimensionLabel}` : 'Não selecionada' },
    { label: 'Perfil', value: profile },
    { label: 'Guia', value: draft.profileWidth === null ? 'Não selecionada' : `${profile} × ${profileLengthLabel}` },
    { label: 'Montante', value: draft.profileWidth === null ? 'Não selecionado' : `${profile} × ${profileLengthLabel}` },
    { label: 'Espaçamento', value: spacing?.label ?? 'Não selecionado' },
    { label: 'Aplicação', value: sides?.label ?? 'Não selecionada' },
    { label: 'Isolamento', value: draft.hasInsulation ? insulation?.label ?? 'Selecione o tipo' : 'Não' },
    { label: 'Margem de perda', value: waste?.label ?? 'Não selecionada' },
    { label: 'Banda acústica', value: draft.acousticBand == null ? 'Não selecionada' : draft.acousticBand ? 'Sim' : 'Não' },
  ];

  return (
    <View style={styles.card}>
      <Text accessibilityRole="header" style={styles.title}>Configuração selecionada</Text>
      {rows.map((row) => (
        <Text key={row.label} style={styles.row}>
          <Text style={styles.label}>{row.label}: </Text>{row.value}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { padding: 16, gap: 12, borderWidth: 1, borderColor: Brand.accent, borderRadius: 16, backgroundColor: '#EDF7F1' },
  title: { color: Brand.dark, fontSize: 18, lineHeight: 25, fontWeight: '700' },
  row: { color: Brand.dark, fontSize: 14, lineHeight: 22 },
  label: { fontWeight: '600' },
});
