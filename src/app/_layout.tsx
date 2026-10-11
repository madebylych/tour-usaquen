import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { setAudioModeAsync } from 'expo-audio';
import * as SplashScreen from 'expo-splash-screen';
import {
  BricolageGrotesque_700Bold,
  BricolageGrotesque_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/bricolage-grotesque';
import { DMSans_400Regular, DMSans_500Medium, DMSans_700Bold } from '@expo-google-fonts/dm-sans';

import { fonts, ThemeProvider, useTheme } from '@/theme';

SplashScreen.preventAutoHideAsync();

// Los audios del tour suenan aunque el iPhone esté en modo silencio:
// el visitante los reproduce a propósito.
setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});

export default function RootLayout() {
  const [loaded, error] = useFonts({
    BricolageGrotesque_700Bold,
    BricolageGrotesque_800ExtraBold,
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_700Bold,
  });

  useEffect(() => {
    if (loaded || error) SplashScreen.hideAsync();
  }, [loaded, error]);

  // Si la fuente falla, la app sigue con la fuente del sistema.
  if (!loaded && !error) return null;

  return (
    <ThemeProvider>
      <ThemedStack />
    </ThemeProvider>
  );
}

// Navegación y barra de estado con los colores del tema activo.
function ThemedStack() {
  const { colors, dark } = useTheme();
  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerTitleStyle: { fontFamily: fonts.display },
          headerTitleAlign: 'center',
          headerShadowVisible: false,
        }}
      >
        <Stack.Screen name="tour" options={{ headerShown: true, title: 'Tu recorrido' }} />
      </Stack>
      <StatusBar style={dark ? 'light' : 'dark'} />
    </>
  );
}
