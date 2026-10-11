import { Alert, Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import Txt from '@/components/Txt';
import { DownloadStatus } from '@/data/useRouteDownload';
import { line, makeStyles, space, useTheme } from '@/theme';

type Props = {
  status: DownloadStatus;
  onDownload: () => void;
  onDelete: () => void;
};

// Botón de descarga offline con sus estados. No se muestra si no hay
// servidor de contenido (o en la vista previa web).
export default function DownloadButton({ status, onDownload, onDelete }: Props) {
  const { colors } = useTheme();
  const styles = useStyles();
  if (status.kind === 'unavailable') return null;

  if (status.kind === 'downloading') {
    const pct = status.total > 0 ? status.done / status.total : 0;
    return (
      <View style={[styles.base, styles.soft]} accessibilityLabel={`Descargando, ${status.done} de ${status.total}`}>
        <View style={[styles.progressFill, { width: `${pct * 100}%` }]} />
        <Ionicons name="cloud-download-outline" size={20} color={colors.text} />
        <Txt variant="label" color={colors.text}>
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
        <Ionicons name="checkmark-circle" size={20} color={colors.text} />
        <Txt variant="label" color={colors.text}>
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
      <Ionicons name={icon} size={20} color={colors.text} />
      <Txt variant="label" color={colors.text}>
        {label}
      </Txt>
    </Pressable>
  );
}

const useStyles = makeStyles((colors) => ({
  base: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.s,
    paddingHorizontal: space.m + 2,
    borderWidth: line,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  soft: { backgroundColor: colors.surface },
  pressed: { opacity: 0.8 },
  progressFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: colors.primarySoft,
  },
}));
