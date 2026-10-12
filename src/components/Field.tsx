import { TextInput, TextInputProps, View } from 'react-native';

import Txt from '@/components/Txt';
import { fonts, line, makeStyles, radius, space, useTheme } from '@/theme';

type Props = Omit<TextInputProps, 'style'> & {
  label: string;
  hint?: string; // ayuda corta debajo del campo
};

// Campo de formulario (panel de administración): etiqueta + caja de tinta.
export default function Field({ label, hint, multiline, ...input }: Props) {
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <View style={styles.field}>
      <Txt variant="label">{label}</Txt>
      <TextInput
        {...input}
        multiline={multiline}
        accessibilityLabel={label}
        placeholderTextColor={colors.textMuted}
        style={[styles.input, multiline && styles.multiline]}
      />
      {hint ? <Txt variant="caption">{hint}</Txt> : null}
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  field: { gap: space.xs + 2 },
  input: {
    minHeight: 48,
    paddingHorizontal: space.m - 4,
    paddingVertical: space.s + 2,
    borderWidth: line,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    color: colors.text,
    fontFamily: fonts.regular,
    fontSize: 16,
    borderRadius: radius.s,
  },
  multiline: { minHeight: 110, textAlignVertical: 'top' },
}));
