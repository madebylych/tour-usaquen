import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { colors } from '@/theme';

export default function RootLayout() {
  return (
    <>
      <Stack
        screenOptions={{
          headerTintColor: colors.accent,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="ruta/[slug]" options={{ title: 'Recorrido' }} />
        <Stack.Screen name="tour" options={{ title: 'Tour' }} />
        <Stack.Screen name="lugar/[id]" options={{ title: '' }} />
        <Stack.Screen name="completado" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style="dark" />
    </>
  );
}
