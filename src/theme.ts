// Sistema visual "Risografía" (dirección E del Figma): los talleres de
// impresión y los fanzines del distrito. Azul y amarillo de risografía
// sobre papel, bordes de tinta, esquinas rectas, sombras duras desplazadas
// (como una segunda tinta mal registrada), fotos en trama de puntos y
// paradas como boletos.
//
// Dos paletas: papel (claro) y "papel negro" (oscuro), la misma impresión
// sobre cartulina negra: texto y bordes color papel, azul más claro y el
// mismo amarillo. Todos los pares de texto cumplen contraste AA (4.5:1).
// Las pantallas toman los colores con useTheme() y los estilos con
// makeStyles(); los archivos no deben importar una paleta directamente.

import { createContext, createElement, ReactNode, useContext, useMemo, useState } from 'react';
import { StyleSheet, useColorScheme } from 'react-native';

import { storage } from '@/data/storage';

export const lightColors = {
  primary: '#1D5BD6', // azul riso (5.6:1 con blanco)
  primaryDark: '#15151A', // tinta, para texto sobre fondos de color
  primarySoft: '#D6E2FA', // azul claro: fondos suaves, trama
  onPrimary: '#FFFFFF',
  accentOnPrimary: '#FFD83D', // etiquetas sobre fondo azul

  accent: '#FFD83D', // amarillo riso
  onAccent: '#15151A', // sobre el amarillo siempre va tinta
  risoEcho: '#FFD83D', // copia desplazada de los títulos (Txt riso)

  background: '#F4F1EA', // papel
  surface: '#FFFFFF',
  text: '#15151A', // tinta
  textMuted: '#625F58',
  border: '#15151A', // bordes de tinta
};

export type Colors = typeof lightColors;

export const darkColors: Colors = {
  primary: '#5B8FF5', // azul más claro para leerse sobre negro
  primaryDark: '#15151A',
  primarySoft: '#1E2A47',
  onPrimary: '#15151A', // sobre este azul, tinta (5.8:1)
  accentOnPrimary: '#15151A', // el amarillo no se lee sobre el azul claro

  accent: '#FFD83D',
  onAccent: '#15151A',
  // Mostaza oscura: el amarillo puro brillaba más que el título y lo tapaba.
  risoEcho: '#8C6C0E',

  background: '#131318', // papel negro
  surface: '#1E1E26',
  text: '#F4F1EA', // tinta color papel
  textMuted: '#A8A49B',
  border: '#F4F1EA',
};

export const space = {
  xs: 4,
  s: 8,
  m: 16,
  l: 24,
  xl: 40,
};

// Esquinas rectas: es impresión, no app de delivery. `pill` queda solo
// para círculos (pines del mapa, punto del usuario).
export const radius = {
  s: 0,
  m: 0,
  l: 0,
  pill: 999,
};

export const line = 1.5; // grosor del borde de tinta

export const fonts = {
  display: 'BricolageGrotesque_800ExtraBold',
  displayBold: 'BricolageGrotesque_700Bold',
  regular: 'DMSans_400Regular',
  medium: 'DMSans_500Medium',
  bold: 'DMSans_700Bold',
};

// Sombras duras, sin desenfoque: la "segunda tinta" desplazada.
export const shadows = (colors: Colors) => ({
  floating: `4px 4px 0px ${colors.border}`,
});

// --- Tema activo -----------------------------------------------------------

// 'system' sigue el modo del celular; 'light' y 'dark' los fija la persona
// con el botón del inicio (se recuerda entre sesiones).
export type ThemeMode = 'system' | 'light' | 'dark';
const STORAGE_KEY = 'theme.v1';

type Theme = {
  colors: Colors;
  dark: boolean;
  setMode: (mode: ThemeMode) => void;
};

const ThemeContext = createContext<Theme>({ colors: lightColors, dark: false, setMode: () => {} });

function readMode(): ThemeMode {
  const saved = storage.get(STORAGE_KEY);
  return saved === 'light' || saved === 'dark' ? saved : 'system';
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const system = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>(readMode);
  const dark = mode === 'system' ? system === 'dark' : mode === 'dark';

  const value = useMemo<Theme>(
    () => ({
      colors: dark ? darkColors : lightColors,
      dark,
      setMode: (next) => {
        setModeState(next);
        if (next === 'system') storage.remove(STORAGE_KEY);
        else storage.set(STORAGE_KEY, next);
      },
    }),
    [dark]
  );
  return createElement(ThemeContext.Provider, { value }, children);
}

export function useTheme(): Theme {
  return useContext(ThemeContext);
}

// Estilos que dependen de la paleta. Se crean una vez por paleta.
//   const useStyles = makeStyles((colors) => ({ box: { backgroundColor: colors.surface } }));
//   ...dentro del componente: const styles = useStyles();
export function makeStyles<T extends StyleSheet.NamedStyles<T>>(build: (colors: Colors) => T) {
  const cache = new Map<Colors, T>();
  return function useStyles(): T {
    const { colors } = useTheme();
    let styles = cache.get(colors);
    if (!styles) {
      styles = StyleSheet.create(build(colors));
      cache.set(colors, styles);
    }
    return styles;
  };
}
