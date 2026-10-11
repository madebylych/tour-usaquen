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

  background: '#FFFFFF', // papel blanco
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

  background: '#131318', // papel negro
  surface: '#1E1E26',
  text: '#F4F1EA', // tinta color papel
  textMuted: '#A8A49B',
  border: '#F4F1EA',
};

// --- Color principal (Ajustes > Color) ---------------------------------------
// El amarillo y la tinta son la identidad y no cambian; cambia el color
// principal (títulos, botones, pines) y su versión suave. Cada par cumple
// AA: en claro, texto blanco sobre el color y el color sobre blanco (≥5:1);
// en oscuro, tinta sobre el color y el color sobre el papel negro (≥5.8:1).

export type PaletteName = 'azul' | 'morado' | 'rosado' | 'verde' | 'naranja' | 'rojo';

export const PALETTES: Record<PaletteName, { label: string; light: string; dark: string }> = {
  azul: { label: 'Azul', light: '#1D5BD6', dark: '#5B8FF5' },
  morado: { label: 'Morado', light: '#6D3FD1', dark: '#A98BFA' },
  rosado: { label: 'Rosado', light: '#C2185B', dark: '#F48FB1' },
  verde: { label: 'Verde', light: '#1B7A43', dark: '#5BD48A' },
  naranja: { label: 'Naranja', light: '#C2410C', dark: '#FB923C' },
  rojo: { label: 'Rojo', light: '#C62828', dark: '#F87171' },
};

// Mezcla dos colores (#rrggbb): t = 0 da `a`, t = 1 da `b`.
function mix(a: string, b: string, t: number): string {
  const ch = (hex: string, i: number) => parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16);
  const out = [0, 1, 2].map((i) => Math.round(ch(a, i) + (ch(b, i) - ch(a, i)) * t));
  return '#' + out.map((v) => v.toString(16).padStart(2, '0')).join('');
}

function withPalette(base: Colors, primary: string, dark: boolean): Colors {
  return {
    ...base,
    primary,
    // Suave: casi papel en claro; un tono oscuro del color en oscuro.
    primarySoft: dark ? mix(base.background, primary, 0.22) : mix('#FFFFFF', primary, 0.18),
  };
}

// Todas las combinaciones se arman una vez (makeStyles guarda estilos por paleta).
const THEMES = Object.fromEntries(
  (Object.keys(PALETTES) as PaletteName[]).map((name) => [
    name,
    {
      light: withPalette(lightColors, PALETTES[name].light, false),
      dark: withPalette(darkColors, PALETTES[name].dark, true),
    },
  ])
) as Record<PaletteName, { light: Colors; dark: Colors }>;

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
// en Ajustes (se recuerda entre sesiones).
export type ThemeMode = 'system' | 'light' | 'dark';
const STORAGE_KEY = 'theme.v1';

type Theme = {
  colors: Colors;
  dark: boolean;
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  palette: PaletteName;
  setPalette: (palette: PaletteName) => void;
};

const ThemeContext = createContext<Theme>({
  colors: lightColors,
  dark: false,
  mode: 'system',
  setMode: () => {},
  palette: 'azul',
  setPalette: () => {},
});

const PALETTE_KEY = 'palette.v1';

function readPalette(): PaletteName {
  const saved = storage.get(PALETTE_KEY);
  return saved && saved in PALETTES ? (saved as PaletteName) : 'azul';
}

function readMode(): ThemeMode {
  const saved = storage.get(STORAGE_KEY);
  return saved === 'light' || saved === 'dark' ? saved : 'system';
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const system = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>(readMode);
  const [palette, setPaletteState] = useState<PaletteName>(readPalette);
  const dark = mode === 'system' ? system === 'dark' : mode === 'dark';

  const value = useMemo<Theme>(
    () => ({
      colors: THEMES[palette][dark ? 'dark' : 'light'],
      dark,
      mode,
      palette,
      setPalette: (next) => {
        setPaletteState(next);
        storage.set(PALETTE_KEY, next);
      },
      setMode: (next) => {
        setModeState(next);
        if (next === 'system') storage.remove(STORAGE_KEY);
        else storage.set(STORAGE_KEY, next);
      },
    }),
    [dark, mode, palette]
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
