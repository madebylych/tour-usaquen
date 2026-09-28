import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import Txt from '@/components/Txt';
import { DownloadStatus } from '@/data/useRouteDownload';
import { colors, radius, space } from '@/theme';

type Props = {
  status: DownloadStatus;
  onDownload: () => void;
  onDelete: () => void;
};

// Botón de descarga offline con sus estados. No se muestra si no hay
// servidor de contenido (o en la vista previa web).
export default function DownloadButton({ status, onDownload, onDelete }: Props) {
  if (status.kind === 'unavailable') return null;

  if (status.kind === 'downloading') {
    const pct = status.total > 0 ? status.done / status.total : 0;
    return (
      <View style={[styles.base, styles.soft]} accessibilityLabel={`Descargando, ${status.done} de ${status.total}`}>
        <View style={[styles.progressFill, { width: `${pct * 100}%` }]} />
        <Ionicons name="cloud-download-outline" size={20} color={colors.primary} />
        <Txt variant="label" color={colors.primary}>
          {status.done}/{status.total}
        </Txt>
      </View>
    );
  }

  if (status.kind === 'downloaded' && !status.outdated) {
    const confirmDelete = () =>
      Alert.alert('Recorrido descargado', 'Está guardado en tu celular y funciona sin conexión.', [
        { text: 'Cerrar', style: 'cancel' },
        { text: 'Borrar descarga', style: 'destructive', onPress: onDelete },
      ]);
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Recorrido descargado. Toca para ver opciones"
        onPress={confirmDelete}
        style={[styles.base, styles.soft]}
      >
        <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
        <Txt variant="label" color={colors.primary}>
          Offline
        </Txt>
      </Pressable>
    );
  }

  const label =
    status.kind === 'downloaded' ? 'Actualizar' : status.kind === 'error' ? 'Reintentar' : 'Descargar';
  const icon = status.kind === 'error' ? 'refresh' : 'download-outline';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityHint={status.kind === 'error' ? status.message : 'Guarda el recorrido para usarlo sin conexión'}
      onPress={onDownload}
      style={({ pressed }) => [styles.base, styles.soft, pressed && styles.pressed]}
    >
      <Ionicons name={icon} size={20} color={colors.primary} />
      <Txt variant="label" color={colors.primary}>
        {label}
      </Txt>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.s,
    paddingHorizontal: space.l - 4,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  soft: { backgroundColor: colors.primarySoft },
  pressed: { opacity: 0.8 },
  progressFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(209, 0, 111, 0.18)',
  },
});
