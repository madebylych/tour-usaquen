import { Text, TextProps } from 'react-native';

import { fonts, makeStyles, useTheme } from '@/theme';

// Texto con las variantes tipográficas de la app. Usar siempre este
// componente en vez de <Text> para que la fuente sea consistente.
// overline: etiquetas cortas en mayúsculas ("PARADA 02, MÚSICA").
type Variant = 'display' | 'title' | 'heading' | 'body' | 'label' | 'caption' | 'overline';

type Props = TextProps & {
  variant?: Variant;
  color?: string;
  // Subtítulo en amarillo riso. Las etiquetas (overline) lo son siempre; los
  // títulos de sección lo piden con `highlight`. Un `color` explícito manda
  // (por ejemplo sobre fondo azul).
  highlight?: boolean;
};

export default function Txt({ variant = 'body', color, style, highlight, ...rest }: Props) {
  const styles = useStyles();
  const { colors } = useTheme();
  const subtitle = highlight ?? variant === 'overline';
  const tint = color ?? (subtitle ? colors.accent : undefined);
  return <Text {...rest} style={[styles[variant], tint ? { color: tint } : null, style]} />;
}

const useStyles = makeStyles((colors) => ({
  display: { fontFamily: fonts.display, fontSize: 40, lineHeight: 42, letterSpacing: -0.8, color: colors.primary },
  title: { fontFamily: fonts.display, fontSize: 30, lineHeight: 34, letterSpacing: -0.5, color: colors.text },
  heading: { fontFamily: fonts.display, fontSize: 20, lineHeight: 26, color: colors.text },
  body: { fontFamily: fonts.regular, fontSize: 16, lineHeight: 24, color: colors.text },
  label: { fontFamily: fonts.bold, fontSize: 15, lineHeight: 20, color: colors.text },
  caption: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 18, color: colors.textMuted },
  overline: { fontFamily: fonts.bold, fontSize: 12, lineHeight: 16, letterSpacing: 1.6, color: colors.primary },
}));
