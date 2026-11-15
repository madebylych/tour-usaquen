import { useEffect } from 'react';
import { router, Stack } from 'expo-router';
import { Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { setAudioModeAsync } from 'expo-audio';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { DMSans_400Regular, DMSans_500Medium, DMSans_700Bold } from '@expo-google-fonts/dm-sans';

import { runStartupCleanup } from '@/data/cleanup';
import { startProgressSync } from '@/data/progressSync';
import { fonts, ThemeProvider, useTheme } from '@/theme';

SplashScreen.preventAutoHideAsync();

// Los audios del tour suenan aunque el iPhone esté en modo silencio:
// el visitante los reproduce a propósito.
setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});

// Al abrir: borrar descargas a medias y caché de versiones anteriores, y
// juntar el progreso con la cuenta si hay sesión.
runStartupCleanup();
startProgressSync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    LilitaOne: require('../../assets/fonts/LilitaOne-Regular.ttf'),
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

// Volver del encabezado del mapa: mismo nombre y tamaño (44 px) que el resto de la app.
function HeaderBack({ color }: { color: string }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Volver"
      hitSlop={8}
      onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
      style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}
    >
      <Ionicons name="arrow-back" size={22} color={color} />
    </Pressable>
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
          // Cada pantalla entra deslizándose desde la derecha (en Android e iOS).
          animation: 'slide_from_right',
          contentStyle: { backgroundColor: colors.background },
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerTitleStyle: { fontFamily: fonts.display },
          headerTitleAlign: 'center',
          headerShadowVisible: false,
        }}
      >
        <Stack.Screen
          name="tour"
          options={{
            headerShown: true,
            title: 'Tu recorrido',
            headerLeft: () => <HeaderBack color={colors.text} />,
          }}
        />
      </Stack>
      <StatusBar style={dark ? 'light' : 'dark'} />
    </>
  );
}
