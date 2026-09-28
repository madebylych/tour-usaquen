// Sistema visual. Fucsia como color dominante; tarjetas redondeadas sobre
// fondo gris claro; tipografía Nunito (redondeada, gruesa en títulos).
// El fucsia principal cumple contraste AA (5.3:1) con texto blanco.

export const colors = {
  primary: '#D1006F',
  primaryDark: '#A30057',
  primarySoft: '#FFE3F1', // fondos suaves, chips inactivos
  onPrimary: '#FFFFFF',

  background: '#F5F5F7',
  surface: '#FFFFFF',
  text: '#1C1B1F',
  textMuted: '#6B6870',
  border: '#ECEAEE',
};

export const space = {
  xs: 4,
  s: 8,
  m: 16,
  l: 24,
  xl: 40,
};

export const radius = {
  s: 10,
  m: 16,
  l: 24,
  pill: 999,
};

export const fonts = {
  regular: 'Nunito_400Regular',
  semibold: 'Nunito_600SemiBold',
  bold: 'Nunito_700Bold',
  extrabold: 'Nunito_800ExtraBold',
  black: 'Nunito_900Black',
};

export const shadow = {
  card: '0px 4px 14px rgba(28, 27, 31, 0.08)',
  floating: '0px 8px 24px rgba(28, 27, 31, 0.16)',
};
