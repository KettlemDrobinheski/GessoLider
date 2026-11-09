import { useState } from 'react';
import { router } from 'expo-router';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { BudgetButton, BudgetScreen } from '@/components/budget/budget-screen';
import { BudgetCard } from '@/components/budget/budget-card';
import { LoadingMessage } from '@/components/ui/loading-message';
import { useCompanyProfile } from '@/hooks/use-company-profile';
import type { CompanyProfile } from '@/types/company-profile';
import { formatPhone } from '@/utils/client';
import { validateCompanyProfile } from '@/utils/company-profile';
import { Brand } from '@/constants/brand';
import { useResponsiveLayout } from '@/hooks/use-responsive-layout';

const fields: { key: Exclude<keyof CompanyProfile, 'logoUri'>; label: string; multiline?: boolean }[] = [
  { key: 'companyName', label: 'Nome comercial *' }, { key: 'responsibleName', label: 'Nome do responsável' },
  { key: 'phone', label: 'Telefone / WhatsApp' }, { key: 'city', label: 'Cidade' }, { key: 'state', label: 'Estado (UF)' },
  { key: 'serviceRegion', label: 'Região de atendimento' }, { key: 'commercialNote', label: 'Observação comercial', multiline: true },
];

export default function CompanySettingsScreen() {
  const { profile, loading, loadError, reload } = useCompanyProfile();
  function back() { if (router.canGoBack()) router.back(); else router.replace('/home'); }
  if (loading || loadError) return (
    <BudgetScreen title="Dados da GessoLider" headerTitle="Configurações" onBack={back}>
      {loadError ? <Text accessibilityRole="alert" style={styles.text}>{loadError}</Text> : <LoadingMessage label="Carregando dados salvos…" />}
      {!!loadError && <BudgetButton label="Tentar carregar novamente" onPress={() => { void reload(); }} />}
    </BudgetScreen>
  );
  return <CompanyForm initialProfile={profile} onBack={back} />;
}

function CompanyForm({ initialProfile, onBack }: { initialProfile: CompanyProfile; onBack: () => void }) {
  const { saveProfile, saving } = useCompanyProfile();
  const { isWide } = useResponsiveLayout();
  const [draft, setDraft] = useState<CompanyProfile>(() => ({ ...initialProfile, phone: formatPhone(initialProfile.phone) }));
  const [touched, setTouched] = useState<Partial<Record<keyof CompanyProfile, boolean>>>({});
  const [feedback, setFeedback] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const validation = validateCompanyProfile(draft);
  async function save() {
    if (!validation.value || saving) return;
    setFeedback(null);
    setSaveError(null);
    try {
      await saveProfile(validation.value);
      setFeedback('Dados salvos com sucesso.');
    } catch { setSaveError('Não foi possível salvar. Seus dados continuam no formulário; tente novamente.'); }
  }
  return (
    <BudgetScreen title="Dados da GessoLider" headerTitle="Configurações" subtitle="Esses dados serão usados em todos os orçamentos. Apenas o nome comercial é obrigatório."
      keyboard onBack={onBack} footer={<View style={styles.field}>
        {!!feedback && <Text accessibilityRole="alert" style={styles.success}>{feedback}</Text>}
        {!!saveError && <Text accessibilityRole="alert" style={styles.error}>{saveError}</Text>}
        <BudgetButton label={saving ? 'Salvando…' : 'Salvar'} disabled={!validation.value || saving} onPress={() => { void save(); }} />
      </View>}>
      <BudgetCard title="Empresa / profissional">
        <View style={[styles.fields, isWide && styles.fieldsWide]}>
        {fields.map(({ key, label, multiline }) => {
          const error = touched[key] || draft[key].length > 0 ? validation.errors[key] : undefined;
          return <View key={key} style={[styles.field, isWide && styles.fieldWide, isWide && key === 'commercialNote' && styles.fieldFull]}>
            <Text style={styles.label}>{label}</Text>
            <TextInput accessibilityLabel={label} aria-invalid={!!error} aria-describedby={error ? `company-${key}-error` : undefined}
              value={draft[key]} editable={!saving} multiline={multiline} keyboardType={key === 'phone' ? 'phone-pad' : 'default'}
              autoCapitalize={key === 'state' ? 'characters' : key === 'commercialNote' ? 'sentences' : 'words'} maxLength={key === 'state' ? 2 : undefined}
              onBlur={() => setTouched((current) => ({ ...current, [key]: true }))}
              onChangeText={(text) => {
                setFeedback(null); setSaveError(null);
                setDraft((current) => ({ ...current, [key]: key === 'phone' ? formatPhone(text) : key === 'state' ? text.toUpperCase().slice(0, 2) : text }));
              }} style={[styles.input, multiline && styles.notes, !!error && styles.invalid]} textAlignVertical={multiline ? 'top' : 'center'} />
            {!!error && <Text nativeID={`company-${key}-error`} style={styles.error}>{error}</Text>}
          </View>;
        })}
        </View>
      </BudgetCard>
    </BudgetScreen>
  );
}

const styles = StyleSheet.create({
  fields: { gap: 16 }, fieldsWide: { flexDirection: 'row', flexWrap: 'wrap' },
  field: { gap: 8 }, fieldWide: { width: '48%' }, fieldFull: { width: '100%' },
  label: { color: Brand.dark, fontSize: 15, fontWeight: '600' }, text: { color: Brand.dark, fontSize: 14, lineHeight: 22 },
  input: { minHeight: 54, borderWidth: 1.5, borderColor: '#C5CECA', borderRadius: 12, padding: 14, fontSize: 16, color: Brand.dark },
  notes: { minHeight: 120 }, invalid: { borderColor: '#A33232' }, error: { color: '#A33232', fontSize: 13, lineHeight: 20 },
  success: { color: Brand.primary, fontSize: 14, lineHeight: 22 },
});
