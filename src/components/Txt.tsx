import { StyleSheet, Text, TextProps } from 'react-native';

import { colors, fonts } from '@/theme';

// Texto con las variantes tipográficas de la app. Usar siempre este
// componente en vez de <Text> para que la fuente sea consistente.
type Variant = 'display' | 'title' | 'heading' | 'body' | 'label' | 'caption';

type Props = TextProps & {
  variant?: Variant;
  color?: string;
};

export default function Txt({ variant = 'body', color, style, ...rest }: Props) {
  return <Text {...rest} style={[styles[variant], color ? { color } : null, style]} />;
}

const styles = StyleSheet.create({
  display: { fontFamily: fonts.black, fontSize: 32, lineHeight: 38, color: colors.text },
  title: { fontFamily: fonts.extrabold, fontSize: 24, lineHeight: 30, color: colors.text },
  heading: { fontFamily: fonts.extrabold, fontSize: 18, lineHeight: 24, color: colors.text },
  body: { fontFamily: fonts.regular, fontSize: 16, lineHeight: 24, color: colors.text },
  label: { fontFamily: fonts.bold, fontSize: 14, lineHeight: 18, color: colors.text },
  caption: { fontFamily: fonts.semibold, fontSize: 13, lineHeight: 18, color: colors.textMuted },
});
