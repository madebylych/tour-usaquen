import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { colors, fontSize, space } from '@/theme';

// Mensaje centrado para estados de carga, error o "no encontrado".
export default function StateMessage({ message, loading = false }: { message?: string; loading?: boolean }) {
  return (
    <View style={styles.container}>
      {loading ? <ActivityIndicator color={colors.accent} /> : null}
      {message ? <Text style={styles.text}>{message}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: space.l,
    gap: space.m,
    backgroundColor: colors.background,
  },
  text: { fontSize: fontSize.body, color: colors.textMuted, textAlign: 'center' },
});
