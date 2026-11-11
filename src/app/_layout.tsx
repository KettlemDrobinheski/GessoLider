import { Stack } from 'expo-router';

import { CompanyProfileProvider } from '@/hooks/use-company-profile';
import { LocalAccessProvider, useLocalAccess } from '@/hooks/use-local-access';
import { BudgetClientProvider } from '@/hooks/use-budget-client';
import { BudgetDraftProvider } from '@/hooks/use-budget-draft';

export default function RootLayout() {
  return (
    <CompanyProfileProvider>
      <LocalAccessProvider>
        <BudgetClientProvider>
          <BudgetDraftProvider>
            <RootStack />
          </BudgetDraftProvider>
        </BudgetClientProvider>
      </LocalAccessProvider>
    </CompanyProfileProvider>
  );
}

function RootStack() {
  const { active, ready } = useLocalAccess();
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#FFFFFF' } }}>
      <Stack.Screen name="index" />
      <Stack.Protected guard={ready && !active}>
        <Stack.Screen name="login" />
      </Stack.Protected>
      <Stack.Protected guard={ready && active}>
        <Stack.Screen name="home" />
        <Stack.Screen name="explore" />
        <Stack.Screen name="orcamentos/index" />
        <Stack.Screen name="orcamentos/[id]" />
        <Stack.Screen name="configuracoes/empresa" />
        <Stack.Screen name="orcamento/tipo-servico" />
        <Stack.Screen name="orcamento/cliente" />
        <Stack.Screen name="orcamento/medidas" />
        <Stack.Screen name="orcamento/configuracao-parede" />
        <Stack.Screen name="orcamento/configuracao-forro" />
        <Stack.Screen name="orcamento/configuracao-revestimento" />
        <Stack.Screen name="orcamento/materiais" />
        <Stack.Screen name="orcamento/materiais-forro" />
        <Stack.Screen name="orcamento/materiais-revestimento" />
        <Stack.Screen name="orcamento/valores" />
        <Stack.Screen name="orcamento/valores-forro" />
        <Stack.Screen name="orcamento/valores-revestimento" />
        <Stack.Screen name="orcamento/resumo" />
        <Stack.Screen name="orcamento/resumo-forro" />
        <Stack.Screen name="orcamento/resumo-revestimento" />
      </Stack.Protected>
    </Stack>
  );
}
