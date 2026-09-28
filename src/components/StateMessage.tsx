import { ActivityIndicator, StyleSheet, View } from 'react-native';

import Txt from '@/components/Txt';
import { colors, space } from '@/theme';

// Mensaje centrado para estados de carga, error o "no encontrado".
export default function StateMessage({ message, loading = false }: { message?: string; loading?: boolean }) {
  return (
    <View style={styles.container}>
      {loading ? <ActivityIndicator color={colors.primary} size="large" /> : null}
      {message ? (
        <Txt variant="body" color={colors.textMuted} style={styles.text}>
          {message}
        </Txt>
      ) : null}
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
  text: { textAlign: 'center' },
});
