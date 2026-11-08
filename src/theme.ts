// Sistema visual "Pastel" (rediseño 2026-11 a partir del moodboard de
// referencia, página "Referencia recreada" del Figma): base blanca con
// paneles gris claro, un solo acento de color para lo interactivo (naranja
// por defecto), píldora negra para la acción principal, tarjetas muy
// redondeadas con sombras suaves y títulos en Lilita One.
//
// Contraste: el naranja brillante no aguanta texto blanco encima (2.6:1),
// así que sobre los rellenos de color va tinta (onPrimary se calcula para
// cada color) y el texto de color sobre el fondo usa primaryText, una
// versión ajustada que cumple AA (4.5:1). Las pantallas toman los colores
// con useTheme() y los estilos con makeStyles(); los archivos no deben
// importar una paleta directamente.

import { createContext, createElement, ReactNode, useContext, useMemo, useState } from 'react';
import { StyleSheet, useColorScheme } from 'react-native';

import { storage } from '@/data/storage';

const INK = '#15151A';

export const lightColors = {
  primary: '#FF7A12', // relleno de acento: botones pequeños, selección, toggles
  onPrimary: INK, // texto e íconos sobre el relleno de acento (se recalcula por color)
  primaryText: '#B34D00', // acento usado como texto sobre el fondo (AA)
  primarySoft: '#FFF1E6', // fondos suaves del acento
  primaryDark: INK,
  accentOnPrimary: INK,

  accent: '#FFE3CC', // tono clarito del acento, siempre con tinta encima
  hero: '#FFB57F', // fondo cálido de las cabeceras (Inicio)
  onAccent: INK,

  ink: '#111111', // píldora de la acción principal
  onInk: '#FFFFFF',

  background: '#FFFFFF',
  surface: '#FFFFFF', // tarjetas
  panel: '#F5F5F7', // paneles grises dentro de las tarjetas y filas
  text: INK,
  textMuted: '#6F6F78',
  border: '#ECECF0',
  success: '#1E8E3E',
};

export type Colors = typeof lightColors;

export const darkColors: Colors = {
  primary: '#FF8A2A',
  onPrimary: INK,
  primaryText: '#FF9D4D',
  primarySoft: '#3A2514',
  primaryDark: INK,
  accentOnPrimary: INK,

  accent: '#FFD2AD',
  hero: '#7A4A26',
  onAccent: INK,

  ink: '#F4F1EA', // en oscuro la píldora principal es clara
  onInk: INK,

  background: '#131318',
  surface: '#1E1E26',
  panel: '#272730',
  text: '#F4F1EA',
  textMuted: '#A8A6B0',
  border: '#33333D',
  success: '#5BD48A',
};

// --- Color de acento (Ajustes > Color) ---------------------------------------
// La tinta, el blanco y los paneles no cambian; cambia el acento. `light` y
// `dark` son el relleno en cada modo; el texto sobre el relleno y la versión
// para texto se calculan para que cumplan AA.

export type PaletteName = 'naranja' | 'azul' | 'morado' | 'rosado' | 'verde' | 'rojo';

export const PALETTES: Record<PaletteName, { label: string; light: string; dark: string }> = {
  naranja: { label: 'Naranja', light: '#FF7A12', dark: '#FF8A2A' },
  azul: { label: 'Azul', light: '#1D5BD6', dark: '#5B8FF5' },
  morado: { label: 'Morado', light: '#6D3FD1', dark: '#A98BFA' },
  rosado: { label: 'Rosado', light: '#E0368A', dark: '#F48FB1' },
  verde: { label: 'Verde', light: '#1B9E55', dark: '#5BD48A' },
  rojo: { label: 'Rojo', light: '#E53935', dark: '#F87171' },
};

const DEFAULT_PALETTE: PaletteName = 'naranja';

// Mezcla dos colores (#rrggbb): t = 0 da `a`, t = 1 da `b`.
function mix(a: string, b: string, t: number): string {
  const ch = (hex: string, i: number) => parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16);
  const out = [0, 1, 2].map((i) => Math.round(ch(a, i) + (ch(b, i) - ch(a, i)) * t));
  return '#' + out.map((v) => v.toString(16).padStart(2, '0')).join('');
}

function luminance(hex: string): number {
  const [r, g, b] = [0, 1, 2].map((i) => {
    const c = parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

// Acerca `color` a `toward` hasta que cumpla AA sobre `background`.
function readableOn(color: string, background: string, toward: string): string {
  for (let t = 0; t <= 1; t += 0.05) {
    const candidate = mix(color, toward, t);
    if (contrast(candidate, background) >= 4.5) return candidate;
  }
  return toward;
}

function withPalette(base: Colors, primary: string, dark: boolean): Colors {
  return {
    ...base,
    primary,
    // Sobre el relleno: blanco si se lee bien, si no tinta.
    onPrimary: contrast('#FFFFFF', primary) >= 4.5 ? '#FFFFFF' : INK,
    accentOnPrimary: contrast('#FFFFFF', primary) >= 4.5 ? '#FFFFFF' : INK,
    primaryText: readableOn(primary, base.background, dark ? '#FFFFFF' : '#000000'),
    primarySoft: dark ? mix(base.background, primary, 0.22) : mix('#FFFFFF', primary, 0.1),
    accent: dark ? mix('#FFFFFF', primary, 0.32) : mix('#FFFFFF', primary, 0.2),
    hero: dark ? mix(base.background, primary, 0.45) : mix('#FFFFFF', primary, 0.55),
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

export const radius = {
  s: 12, // baldosas pequeñas, fotos de fila
  m: 20, // tarjetas, filas
  l: 28, // tarjetas grandes y hojas que suben desde abajo
  pill: 999, // píldoras y círculos
};

export const line = 1; // grosor del borde

export const fonts = {
  display: 'LilitaOne', // títulos grandes con carácter
  displayBold: 'DMSans_700Bold',
  regular: 'DMSans_400Regular',
  medium: 'DMSans_500Medium',
  bold: 'DMSans_700Bold',
};

// Sombras suaves y difusas.
export const shadows = (colors: Colors) => ({
  floating: `0px 10px 30px ${colors.text}1F`,
  soft: `0px 4px 16px ${colors.text}14`,
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
  palette: DEFAULT_PALETTE,
  setPalette: () => {},
});

// v2: con el rediseño el color por defecto pasó a naranja; quien había
// elegido otro color en la versión anterior empieza en naranja.
const PALETTE_KEY = 'palette.v2';

function readPalette(): PaletteName {
  const saved = storage.get(PALETTE_KEY);
  return saved && saved in PALETTES ? (saved as PaletteName) : DEFAULT_PALETTE;
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
