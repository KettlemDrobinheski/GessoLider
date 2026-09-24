import { StyleSheet, Text, View } from 'react-native';
import { Brand } from '@/constants/brand';

const steps = ['Serviço', 'Medidas', 'Valores', 'Resumo'] as const;

export function BudgetSteps({ activeStep }: { activeStep: 1 | 2 | 3 | 4 }) {
  return (
    <View style={styles.container}>
      {steps.map((label, index) => {
        const active = activeStep === index + 1;
        const completed = index + 1 < activeStep;
        return (
          <View key={label} style={styles.step} accessible
            accessibilityLabel={`Etapa ${index + 1} de 4: ${label}${active ? ', atual' : completed ? ', concluída' : ''}`}>
            <View style={[styles.circle, completed && styles.completedCircle, active && styles.activeCircle]}>
              <Text style={[styles.number, completed && styles.completedNumber, active && styles.activeNumber]}>{completed ? '✓' : index + 1}</Text>
            </View>
            <Text style={[styles.label, active && styles.activeLabel]}>{label}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', gap: 4 },
  step: { flex: 1, minWidth: 0, alignItems: 'center', gap: 8 },
  circle: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#EEF1EF', alignItems: 'center', justifyContent: 'center' },
  activeCircle: { backgroundColor: Brand.primary },
  completedCircle: { backgroundColor: '#EDF7F1', borderWidth: 1, borderColor: Brand.accent },
  completedNumber: { color: Brand.primary },
  number: { color: '#60706A', fontSize: 14, fontWeight: '700' },
  activeNumber: { color: Brand.white },
  label: { color: '#60706A', fontSize: 12, textAlign: 'center' },
  activeLabel: { color: Brand.primary, fontWeight: '700' },
});
