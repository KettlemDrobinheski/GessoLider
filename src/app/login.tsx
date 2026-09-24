import { useRef, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BrandLogo } from '@/components/brand-logo';
import { Brand } from '@/constants/brand';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const passwordInput = useRef<TextInput>(null);

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scroll}>
          <View style={styles.container}>
            <BrandLogo />
            <Text accessibilityRole="header" style={styles.title}>Acesse sua conta</Text>
            <View style={styles.form}>
              <View style={styles.field}>
                <Text style={styles.label}>E-mail</Text>
                <TextInput
                  accessibilityLabel="E-mail" style={styles.input} value={email} onChangeText={setEmail}
                  keyboardType="email-address" autoCapitalize="none" autoCorrect={false}
                  autoComplete="email" textContentType="emailAddress" returnKeyType="next"
                  onSubmitEditing={() => passwordInput.current?.focus()} submitBehavior="submit"
                />
              </View>
              <View style={styles.field}>
                <Text style={styles.label}>Senha</Text>
                <View style={styles.passwordRow}>
                  <TextInput
                    ref={passwordInput} accessibilityLabel="Senha" style={styles.passwordInput}
                    value={password} onChangeText={setPassword} secureTextEntry={!showPassword}
                    autoCapitalize="none" autoCorrect={false} autoComplete="current-password"
                    textContentType="password" returnKeyType="done"
                  />
                  <Pressable accessibilityRole="button" accessibilityLabel={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                    onPress={() => setShowPassword((shown) => !shown)} style={styles.toggle}>
                    <Text style={styles.linkText}>{showPassword ? 'Ocultar' : 'Mostrar'}</Text>
                  </Pressable>
                </View>
              </View>
              <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: remember }}
                onPress={() => setRemember((checked) => !checked)} style={styles.remember}>
                <View style={[styles.checkbox, remember && styles.checked]}>
                  {remember && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={styles.body}>Lembrar de mim</Text>
              </Pressable>
              {/* Temporary navigation for previewing the flow; this does not authenticate. */}
              <Pressable accessibilityRole="button" onPress={() => router.push('/home')} style={styles.primaryButton}>
                <Text style={styles.primaryText}>Entrar</Text>
              </Pressable>
              <Pressable disabled accessibilityRole="button" accessibilityState={{ disabled: true }} style={styles.textButton}>
                <Text style={styles.linkText}>Esqueceu sua senha?</Text>
              </Pressable>
            </View>
            <View style={styles.separator}>
              <View style={styles.line} /><Text style={styles.body}>ou continue com</Text><View style={styles.line} />
            </View>
            <View style={styles.socialRow}>
              {['Google', 'Apple'].map((provider) => (
                <Pressable key={provider} disabled accessibilityRole="button" accessibilityState={{ disabled: true }} style={styles.socialButton}>
                  <Text style={styles.socialText}>{provider}</Text>
                </Pressable>
              ))}
            </View>
            <View style={styles.signup}>
              <Text style={styles.body}>Não tem uma conta?</Text>
              <Pressable disabled accessibilityRole="button" accessibilityState={{ disabled: true }} style={styles.textButton}>
                <Text style={styles.linkText}>Cadastre-se</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Brand.white },
  scroll: { flexGrow: 1, alignItems: 'center' },
  container: { width: '100%', maxWidth: 480, paddingHorizontal: 28, paddingVertical: 28 },
  title: { color: Brand.dark, fontSize: 26, fontWeight: '700', textAlign: 'center', marginTop: 28, marginBottom: 28 },
  form: { gap: 16 },
  field: { gap: 8 },
  label: { color: Brand.dark, fontSize: 16, fontWeight: '500' },
  input: { borderWidth: 1, borderColor: Brand.primary, borderRadius: 12, minHeight: 54, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, color: Brand.dark },
  passwordRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: Brand.primary, borderRadius: 12 },
  passwordInput: { flex: 1, minWidth: 0, minHeight: 54, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, color: Brand.dark },
  toggle: { minHeight: 48, justifyContent: 'center', paddingHorizontal: 12 },
  remember: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 44 },
  checkbox: { width: 22, height: 22, borderWidth: 1.5, borderColor: Brand.primary, borderRadius: 5, alignItems: 'center', justifyContent: 'center' },
  checked: { backgroundColor: Brand.primary },
  checkmark: { color: Brand.white, fontWeight: '700' },
  body: { color: Brand.dark, fontSize: 14, flexShrink: 1 },
  primaryButton: { backgroundColor: Brand.primary, minHeight: 56, borderRadius: 14, padding: 16, alignItems: 'center', justifyContent: 'center' },
  primaryText: { color: Brand.white, fontSize: 18, fontWeight: '700' },
  textButton: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  linkText: { color: Brand.primary, fontWeight: '600', fontSize: 14 },
  separator: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 24 },
  line: { flex: 1, height: 1, backgroundColor: Brand.accent },
  socialRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  socialButton: { flexGrow: 1, flexBasis: 120, minHeight: 54, padding: 14, borderWidth: 1, borderColor: Brand.primary, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  socialText: { color: Brand.dark, fontSize: 16, fontWeight: '600' },
  signup: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: 6, marginTop: 24 },
});
