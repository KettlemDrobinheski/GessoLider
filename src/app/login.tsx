import { useState } from 'react';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BrandLogo } from '@/components/brand-logo';
import { Brand } from '@/constants/brand';
import { useLocalAccess } from '@/hooks/use-local-access';

export default function LocalAccessScreen() {
  const { enter, error: storageError } = useLocalAccess();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function continueLocally() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await enter();
      router.replace('/home');
    } catch {
      setError('O acesso não foi iniciado. Verifique o armazenamento e tente novamente.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar style="dark" />
      <View style={styles.content}>
        <BrandLogo />
        <Text accessibilityRole="header" style={styles.title}>Acesso neste dispositivo</Text>
        <Text style={styles.body}>O GessoLider funciona localmente. Continuar libera os recursos salvos neste aparelho e mantém esse acesso até você encerrá-lo nas configurações.</Text>
        <View style={styles.notice}>
          <Text style={styles.noticeTitle}>Sem conta ou autenticação</Text>
          <Text style={styles.noticeBody}>Este acesso local não confirma sua identidade, não sincroniza dados e não protege os registros contra outras pessoas com acesso ao aparelho. Senha, cadastro, login social e recuperação de conta ainda dependem de um backend.</Text>
        </View>
        {!!(error || storageError) && <Text accessibilityRole="alert" style={styles.error}>{error ?? storageError}</Text>}
        <Pressable accessibilityRole="button" disabled={busy} onPress={() => { void continueLocally(); }}
          style={({ pressed }) => [styles.button, busy && styles.disabled, pressed && !busy && styles.pressed]}>
          <Text style={styles.buttonText}>{busy ? 'Abrindo…' : 'Continuar neste dispositivo'}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Brand.white, justifyContent: 'center' },
  content: { width: '100%', maxWidth: 520, alignSelf: 'center', padding: 28, gap: 20 },
  title: { color: Brand.dark, fontSize: 26, fontWeight: '700', textAlign: 'center', marginTop: 12 },
  body: { color: Brand.dark, fontSize: 15, lineHeight: 23, textAlign: 'center' },
  notice: { gap: 8, padding: 16, borderRadius: 14, backgroundColor: '#F3F6F4', borderWidth: 1, borderColor: '#DFE8E3' },
  noticeTitle: { color: Brand.dark, fontSize: 15, fontWeight: '700' },
  noticeBody: { color: '#60706A', fontSize: 13, lineHeight: 20 },
  error: { color: '#A33232', fontSize: 14, lineHeight: 20 },
  button: { minHeight: 56, padding: 16, borderRadius: 16, backgroundColor: Brand.primary, alignItems: 'center', justifyContent: 'center' },
  buttonText: { color: Brand.white, fontSize: 17, fontWeight: '700', textAlign: 'center' },
  disabled: { opacity: 0.55 }, pressed: { opacity: 0.8 },
});
