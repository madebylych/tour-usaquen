import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';

import Button from '@/components/Button';
import InkLoader from '@/components/InkLoader';
import Txt from '@/components/Txt';
import { colors, space } from '@/theme';

type Props = {
  message?: string;
  loading?: boolean;
  showHomeButton?: boolean; // para errores sin salida (falta la ruta, no existe)
  onRetry?: () => void; // para errores que pueden resolverse (sin conexión)
};

// Mensaje centrado para estados de carga, error o "no encontrado".
export default function StateMessage({ message, loading = false, showHomeButton = false, onRetry }: Props) {
  return (
    <View style={styles.container}>
      {loading ? <InkLoader /> : null}
      {message ? (
        <Txt variant="body" color={colors.textMuted} style={styles.text}>
          {message}
        </Txt>
      ) : null}
      {onRetry ? <Button label="Reintentar" icon="refresh" onPress={onRetry} /> : null}
      {showHomeButton ? <Button label="Volver al inicio" variant="secondary" onPress={() => router.replace('/')} /> : null}
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
