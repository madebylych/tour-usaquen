import { useCallback, useEffect } from 'react';
import { Pressable, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { Ionicons } from '@expo/vector-icons';

import Txt from '@/components/Txt';
import { line, makeStyles, space, useTheme } from '@/theme';

// Alturas de las barras de la onda (decorativa, igual para todos los audios).
const BARS = [10, 18, 12, 24, 16, 28, 14, 22, 30, 18, 12, 26, 20, 14, 24, 18, 28, 12, 20, 16, 24, 10, 18, 14, 22, 12];

type Props = {
  uri: string | null; // archivo local descargado o URL remota; null si no hay audio
  title: string | null;
  credit: string | null;
};

// Tarjeta "Escucha este lugar". Sin audio, se muestra desactivada.
export default function AudioPlayer({ uri, title, credit }: Props) {
  const { colors } = useTheme();
  const styles = useStyles();
  const player = useAudioPlayer(uri);
  const status = useAudioPlayerStatus(player);
  const available = uri !== null;

  // Al terminar, vuelve al inicio para poder escucharlo otra vez.
  useEffect(() => {
    if (status.didJustFinish) player.seekTo(0).catch(() => {});
  }, [status.didJustFinish, player]);

  // Al abrir otra pantalla encima, la anterior sigue montada: sin esto su
  // audio seguiría sonando debajo del de la parada nueva.
  useFocusEffect(
    useCallback(() => {
      return () => {
        try {
          player.pause();
        } catch {
          // Al cerrar la pantalla el reproductor puede estar ya liberado.
        }
      };
    }, [player])
  );

  const toggle = () => {
    if (!available) return;
    if (status.playing) player.pause();
    else player.play();
  };

  const progress = status.duration > 0 ? status.currentTime / status.duration : 0;
  const subtitle = !available
    ? 'Audio pendiente'
    : status.isLoaded
      ? `${formatTime(status.currentTime)} / ${formatTime(status.duration)}`
      : 'Cargando…';

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={status.playing ? 'Pausar audio' : 'Reproducir audio'}
          accessibilityState={{ disabled: !available }}
          onPress={toggle}
          style={[styles.playButton, !available && styles.disabled]}
        >
          <Ionicons
            name={status.playing ? 'pause' : 'play'}
            size={26}
            color={colors.onPrimary}
            style={status.playing ? null : styles.playIcon}
          />
        </Pressable>
        <View style={styles.grow}>
          <Txt variant="label">{title ?? 'Escucha este lugar'}</Txt>
          <Txt variant="caption">{subtitle}</Txt>
        </View>
        <Ionicons name="headset-outline" size={22} color={colors.text} />
      </View>
      {available ? (
        // Onda: las barras ya escuchadas en azul, las que faltan en tinta.
        <View style={styles.wave} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          {BARS.map((h, i) => (
            <View
              key={i}
              style={[styles.bar, { height: h, backgroundColor: i / BARS.length < progress ? colors.primary : colors.text }]}
            />
          ))}
        </View>
      ) : null}
      {credit ? <Txt variant="caption">Audio: {credit}</Txt> : null}
    </View>
  );
}

function formatTime(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

const useStyles = makeStyles((colors) => ({
  card: {
    gap: space.s + 2,
    padding: space.m,
    backgroundColor: colors.surface,
    borderWidth: line,
    borderColor: colors.border,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.m - 2 },
  playButton: {
    width: 52,
    height: 52,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playIcon: { marginLeft: 3 }, // centra ópticamente el triángulo
  disabled: { opacity: 0.35 },
  grow: { flex: 1 },
  wave: { flexDirection: 'row', alignItems: 'center', gap: 3, height: 32 },
  bar: { width: 5 },
}));
