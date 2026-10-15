import { useState } from 'react';
import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';
import { useCompanyProfile } from '@/hooks/use-company-profile';
import { formatCompanySummary } from '@/utils/company-profile';
import { Brand } from '@/constants/brand';

function CompanyLogo({ uri, name }: { uri: string; name: string }) {
  const [failed, setFailed] = useState(false);
  return failed ? null : <Image source={{ uri }} accessibilityLabel={`Logo ${name}`} contentFit="contain" style={styles.logo} onError={() => setFailed(true)} />;
}

export function CompanySummary() {
  const { profile, loading, loadError } = useCompanyProfile();
  const lines = formatCompanySummary(profile);
  return (
    <View style={styles.container}>
      {!!profile.logoUri && <CompanyLogo key={profile.logoUri} uri={profile.logoUri} name={profile.companyName} />}
      {lines.map((line, index) => <Text key={index} accessibilityRole={index === 0 ? 'header' : undefined}
        style={index === 0 ? styles.name : styles.text}>{line}</Text>)}
      {loading && <Text style={styles.text}>Carregando dados da empresa…</Text>}
      {!!loadError && <Text accessibilityRole="alert" style={styles.text}>{loadError}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 8, padding: 16, borderWidth: 1.5, borderColor: '#C5CECA', borderRadius: 16 },
  name: { color: Brand.dark, fontSize: 22, fontWeight: '700' }, text: { color: Brand.dark, fontSize: 14, lineHeight: 22 },
  logo: { width: '100%', maxWidth: 240, height: 80 },
});
