// Sistema visual "Risografía" (dirección E del Figma): los talleres de
// impresión y los fanzines del distrito. Azul y amarillo de risografía
// sobre papel, bordes de tinta, esquinas rectas, sombras duras desplazadas
// (como una segunda tinta mal registrada), fotos en trama de puntos y
// paradas como boletos.
// El azul cumple contraste AA (5.6:1) con texto blanco; sobre el amarillo
// siempre va texto en tinta.

export const colors = {
  primary: '#1D5BD6', // azul riso
  primaryDark: '#15151A', // tinta, para texto sobre fondos de color
  primarySoft: '#D6E2FA', // azul claro: fondos suaves, trama
  onPrimary: '#FFFFFF',

  accent: '#FFD83D', // amarillo riso
  onAccent: '#15151A',

  background: '#F4F1EA', // papel
  surface: '#FFFFFF',
  text: '#15151A', // tinta
  textMuted: '#625F58',
  border: '#15151A', // bordes de tinta
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
export const shadow = {
  card: 'none',
  floating: `4px 4px 0px ${colors.text}`,
  accent: `5px 5px 0px ${colors.accent}`, // botón azul con eco amarillo
  ink: `5px 5px 0px ${colors.text}`, // botón amarillo con eco de tinta
};
