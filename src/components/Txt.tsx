import { Animated, Text, TextProps, View } from 'react-native';

import { useRegistration } from '@/components/motion';
import { fonts, makeStyles } from '@/theme';

// Texto con las variantes tipográficas de la app. Usar siempre este
// componente en vez de <Text> para que la fuente sea consistente.
// overline: etiquetas cortas en mayúsculas ("PARADA 02, MÚSICA").
type Variant = 'display' | 'title' | 'heading' | 'body' | 'label' | 'caption' | 'overline';

type Props = TextProps & {
  variant?: Variant;
  color?: string;
  // Título "mal registrado": una copia en amarillo desplazada detrás, como
  // una impresión de risografía con las tintas corridas.
  riso?: boolean;
};

const RISO_OFFSET = 3;

export default function Txt({ variant = 'body', color, style, riso = false, ...rest }: Props) {
  const styles = useStyles();
  const text = <Text {...rest} style={[styles[variant], color ? { color } : null, style]} />;
  if (!riso) return text;
  return (
    <View>
      <RisoEcho {...rest} style={[styles[variant], style, styles.risoEcho]} />
      {text}
    </View>
  );
}

// Copia amarilla del título. Al aparecer, la tinta llega corrida y se
// "registra" en su desplazamiento final.
function RisoEcho(props: TextProps) {
  const transform = useRegistration(RISO_OFFSET);
  return (
    <Animated.Text
      {...props}
      accessible={false}
      aria-hidden
      importantForAccessibility="no-hide-descendants"
      style={[props.style, { transform }]}
    />
  );
}

const useStyles = makeStyles((colors) => ({
  display: { fontFamily: fonts.display, fontSize: 40, lineHeight: 42, letterSpacing: -0.8, color: colors.primary },
  title: { fontFamily: fonts.display, fontSize: 30, lineHeight: 34, letterSpacing: -0.5, color: colors.text },
  heading: { fontFamily: fonts.display, fontSize: 20, lineHeight: 26, color: colors.text },
  body: { fontFamily: fonts.regular, fontSize: 16, lineHeight: 24, color: colors.text },
  label: { fontFamily: fonts.bold, fontSize: 15, lineHeight: 20, color: colors.text },
  caption: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 18, color: colors.textMuted },
  overline: { fontFamily: fonts.bold, fontSize: 12, lineHeight: 16, letterSpacing: 1.6, color: colors.primary },
  risoEcho: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    color: colors.risoEcho,
  },
}));
