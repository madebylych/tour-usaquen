import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { setAudioModeAsync } from 'expo-audio';
import * as SplashScreen from 'expo-splash-screen';
import {
  Nunito_400Regular,
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_800ExtraBold,
  Nunito_900Black,
  useFonts,
} from '@expo-google-fonts/nunito';

import { colors, fonts } from '@/theme';

SplashScreen.preventAutoHideAsync();

// Los audios del tour suenan aunque el iPhone esté en modo silencio:
// el visitante los reproduce a propósito.
setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});

export default function RootLayout() {
  const [loaded, error] = useFonts({
    Nunito_400Regular,
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
    Nunito_900Black,
  });

  useEffect(() => {
    if (loaded || error) SplashScreen.hideAsync();
  }, [loaded, error]);

  // Si la fuente falla, la app sigue con la fuente del sistema.
  if (!loaded && !error) return null;

  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          headerStyle: { backgroundColor: colors.primary },
          headerTintColor: colors.onPrimary,
          headerTitleStyle: { fontFamily: fonts.extrabold },
          headerShadowVisible: false,
        }}
      >
        <Stack.Screen name="tour" options={{ headerShown: true, title: 'Tu recorrido' }} />
      </Stack>
      <StatusBar style="light" />
    </>
  );
}
