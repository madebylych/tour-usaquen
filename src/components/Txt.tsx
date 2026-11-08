import { Text, TextProps } from 'react-native';

import { fonts, makeStyles, useTheme } from '@/theme';

// Texto con las variantes tipográficas de la app. Usar siempre este
// componente en vez de <Text> para que la fuente sea consistente.
// display: titulares grandes en Lilita One ("Pasaporte", "¡Descubriste!").
// overline: etiquetas cortas en mayúsculas, en gris ("RUTA 01").
type Variant = 'display' | 'title' | 'heading' | 'body' | 'label' | 'caption' | 'overline';

type Props = TextProps & {
  variant?: Variant;
  color?: string;
  // Texto en el color de acento (versión legible sobre el fondo). Un
  // `color` explícito manda.
  highlight?: boolean;
};

export default function Txt({ variant = 'body', color, style, highlight, ...rest }: Props) {
  const styles = useStyles();
  const { colors } = useTheme();
  const tint = color ?? (highlight ? colors.primaryText : undefined);
  return <Text {...rest} style={[styles[variant], tint ? { color: tint } : null, style]} />;
}

const useStyles = makeStyles((colors) => ({
  display: { fontFamily: fonts.display, fontSize: 42, lineHeight: 46, color: colors.text },
  title: { fontFamily: fonts.bold, fontSize: 26, lineHeight: 32, letterSpacing: -0.4, color: colors.text },
  heading: { fontFamily: fonts.bold, fontSize: 18, lineHeight: 24, color: colors.text },
  body: { fontFamily: fonts.regular, fontSize: 16, lineHeight: 24, color: colors.text },
  label: { fontFamily: fonts.bold, fontSize: 15, lineHeight: 20, color: colors.text },
  caption: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 18, color: colors.textMuted },
  overline: { fontFamily: fonts.medium, fontSize: 12, lineHeight: 16, letterSpacing: 1.6, color: colors.textMuted },
}));
