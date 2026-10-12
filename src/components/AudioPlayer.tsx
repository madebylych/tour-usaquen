import { useCallback, useEffect, useState } from 'react';
import { Animated, Easing, Pressable, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { Ionicons } from '@expo/vector-icons';

import { setPlayerVolume } from '@/audio/volume';
import { useHover, useReducedMotion } from '@/components/motion';
import Txt from '@/components/Txt';
import { useSettings } from '@/data/settings';
import { line, makeStyles, radius, space, useTheme } from '@/theme';
import { tap } from '@/audio/haptics';

// Alturas de las barras de la onda (decorativa, igual para todos los audios).
// Cuánto crece o se encoge cada barra con el pulso (se repite cada 5).
const BEAT = [
  [1, 0.45],
  [0.6, 1.15],
  [1, 0.7],
  [0.5, 1],
  [0.85, 1.2],
];

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
  const beat = useBeat(status.playing);
  const hover = useHover();

  // Volumen elegido en Ajustes; cambia en vivo si se ajusta mientras suena.
  const { placeVolume } = useSettings();
  useEffect(() => {
    setPlayerVolume(player, placeVolume);
  }, [player, placeVolume]);

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
          onPress={() => {
            tap();
            toggle();
          }}
          {...(available ? hover.handlers : null)}
        >
          {/* Con hover el botón crece; al tocarlo se nota que responde. */}
          <Animated.View
            style={[
              styles.playButton,
              !available && styles.disabled,
              { transform: [{ scale: hover.value.interpolate({ inputRange: [0, 1], outputRange: [1, 1.1] }) }] },
            ]}
          >
            <Ionicons
              name={status.playing ? 'pause' : 'play'}
              size={26}
              color={colors.onPrimary}
              style={status.playing ? null : styles.playIcon}
            />
          </Animated.View>
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
            <Animated.View
              key={i}
              style={[
                styles.bar,
                { height: h, backgroundColor: i / BARS.length < progress ? colors.primary : colors.text },
                // Mientras suena, las barras pulsan; unas suben cuando otras bajan.
                { transform: [{ scaleY: beat.interpolate({ inputRange: [0, 1], outputRange: BEAT[i % BEAT.length] }) }] },
              ]}
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
    borderRadius: radius.m,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.m - 2 },
  playButton: {
    width: 52,
    height: 52,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
  },
  playIcon: { marginLeft: 3 }, // centra ópticamente el triángulo
  disabled: { opacity: 0.35 },
  grow: { flex: 1 },
  wave: { flexDirection: 'row', alignItems: 'center', gap: 3, height: 32 },
  bar: { width: 5 },
}));

// Pulso de la onda: va y viene solo mientras el audio suena; en pausa vuelve
// a su altura. Quieto con "Reducir movimiento".
function useBeat(playing: boolean) {
  const reduced = useReducedMotion();
  const [beat] = useState(() => new Animated.Value(0));
  useEffect(() => {
    if (!playing || reduced) {
      Animated.timing(beat, { toValue: 0, duration: 200, useNativeDriver: true }).start();
      return;
    }
    const step = (toValue: number) =>
      Animated.timing(beat, { toValue, duration: 260, easing: Easing.inOut(Easing.quad), useNativeDriver: true });
    const loop = Animated.loop(Animated.sequence([step(1), step(0)]));
    loop.start();
    return () => loop.stop();
  }, [playing, reduced, beat]);
  return beat;
}
