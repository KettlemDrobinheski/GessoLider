import { Stack } from 'expo-router';

import { CompanyProfileProvider } from '@/hooks/use-company-profile';

export const unstable_settings = {
  anchor: 'index',
};

export default function RootLayout() {
  return (
    <CompanyProfileProvider>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#FFFFFF' } }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
      </Stack>
    </CompanyProfileProvider>
  );
}
