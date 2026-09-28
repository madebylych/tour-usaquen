import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { Ionicons } from '@expo/vector-icons';

import Txt from '@/components/Txt';
import { colors, radius, shadow, space } from '@/theme';

type Props = {
  uri: string | null; // archivo local descargado o URL remota; null si no hay audio
  title: string | null;
  credit: string | null;
};

// Tarjeta "Escucha este lugar". Sin audio, se muestra desactivada.
export default function AudioPlayer({ uri, title, credit }: Props) {
  const player = useAudioPlayer(uri);
  const status = useAudioPlayerStatus(player);
  const available = uri !== null;

  // Al terminar, vuelve al inicio para poder escucharlo otra vez.
  useEffect(() => {
    if (status.didJustFinish) player.seekTo(0).catch(() => {});
  }, [status.didJustFinish, player]);

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
        <Ionicons name="headset-outline" size={22} color={colors.textMuted} />
      </View>
      {available ? (
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${progress * 100}%` }]} />
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

const styles = StyleSheet.create({
  card: {
    gap: space.s + 2,
    padding: space.m - 2,
    borderRadius: radius.m,
    backgroundColor: colors.surface,
    boxShadow: shadow.card,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.m - 2 },
  playButton: {
    width: 52,
    height: 52,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playIcon: { marginLeft: 3 }, // centra ópticamente el triángulo
  disabled: { opacity: 0.35 },
  grow: { flex: 1 },
  track: { height: 6, borderRadius: radius.pill, backgroundColor: colors.primarySoft, overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: colors.primary },
});
