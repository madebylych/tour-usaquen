import { useEffect, useRef } from 'react';
import { Modal, Pressable, View } from 'react-native';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import Button from '@/components/Button';
import InkConfetti from '@/components/InkConfetti';
import MediaImage from '@/components/MediaImage';
import { Appear, Stamp, Wobble } from '@/components/motion';
import PlaceStamps from '@/components/PlaceStamps';
import Txt from '@/components/Txt';
import { setPlayerVolume } from '@/audio/volume';
import { progress, useProgress } from '@/data/progress';
import { useSettings } from '@/data/settings';
import { PlaceWithMedia } from '@/types';
import { fonts, makeStyles, radius, space, useTheme } from '@/theme';

type Props = {
  places: PlaceWithMedia[]; // paradas de la ruta actual
  // atSeconds: hasta dónde sonó el audio aquí (Audio automático), para seguir en la ficha.
  onOpen: (placeId: string, atSeconds?: number) => void;
};

// Hoja de "¡Descubriste!" que sube desde abajo al descubrir una parada: la
// postal del lugar con su etiqueta y su sello, el titular y la fila de
// sellos de la ruta. Si se descubren varias a la vez, salen una tras otra.
export default function DiscoveryCard({ places, onOpen }: Props) {
  const { colors } = useTheme();
  const styles = useStyles();
  const { announcements, discovered } = useProgress();
  const insets = useSafeAreaInsets();
  const { autoPlay } = useSettings();
  const heard = useRef(0); // segundos que sonó el audio en la tarjeta

  const place = places.find((p) => p.id === announcements[0]);
  const position = place ? places.indexOf(place) + 1 : 0;

  return (
    <Modal
      visible={place !== undefined}
      transparent
      animationType="slide"
      onRequestClose={progress.dismissAnnouncement}
    >
      <Pressable style={styles.backdrop} onPress={progress.dismissAnnouncement} accessibilityLabel="Cerrar" />
      {place ? (
        <View key={place.id} style={[styles.sheet, { paddingBottom: insets.bottom + space.m }]}>
          <View style={styles.handle} />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Cerrar"
            onPress={progress.dismissAnnouncement}
            hitSlop={8}
            style={styles.close}
          >
            <Ionicons name="close" size={18} color={colors.textMuted} />
          </Pressable>

          {/* Postal del lugar, la etiqueta y el sello que cae encima. */}
          <View style={styles.art}>
            <Ionicons name="sparkles" size={22} color={colors.text} style={styles.sparkleA} />
            <Ionicons name="sparkles" size={16} color={colors.primary} style={styles.sparkleB} />
            <Stamp delay={150} rotate="5deg">
              <View style={styles.postcard}>
                <MediaImage uri={place.media.image} style={styles.photo} label={place.name} />
                <Txt variant="label" numberOfLines={1} style={styles.caption}>
                  {place.name}
                </Txt>
              </View>
            </Stamp>
            <Stamp delay={500} rotate="-8deg" style={styles.tag}>
              <Wobble delay={1100} from="-8deg" to="-3deg">
                <View style={styles.tagInner}>
                  <Txt variant="label" color={colors.onPrimary}>
                    ¡Nuevo sello!
                  </Txt>
                </View>
              </Wobble>
            </Stamp>
            <Stamp delay={700} rotate="12deg" style={styles.seal}>
              <View style={styles.sealInner}>
                <Txt style={styles.sealSmall}>SELLO</Txt>
                <Txt style={styles.sealBig}>{String(position).padStart(2, '0')}</Txt>
              </View>
            </Stamp>
          </View>

          <Appear delay={420} style={styles.texts}>
            <Txt variant="display" style={styles.title}>
              ¡Descubriste {place.name}!
            </Txt>
            <Txt variant="body" style={[styles.center, styles.soft]}>
              {place.observation_prompt ?? 'Sumaste un sello a tu pasaporte. Escucha la historia de este lugar.'}
            </Txt>
          </Appear>

          {autoPlay && place.media.audio ? (
            <Appear delay={500} style={styles.audio}>
              <AutoAudio
                key={place.id}
                uri={place.media.audio}
                title={place.audio_title}
                onTime={(seconds) => (heard.current = seconds)}
              />
            </Appear>
          ) : null}

          <Appear delay={560} style={styles.stamps}>
            <PlaceStamps places={places} discovered={discovered} size={46} overlap={8} />
          </Appear>

          <Appear delay={640} style={styles.actions}>
            <Button
              label="Ver la parada"
              onPress={() => {
                progress.dismissAnnouncement();
                onOpen(place.id, autoPlay && place.media.audio ? heard.current : undefined);
                heard.current = 0;
              }}
            />
            <Pressable onPress={progress.dismissAnnouncement} style={styles.secondary} accessibilityRole="button">
              <Txt variant="label" color={colors.textMuted}>
                Seguir caminando
              </Txt>
            </Pressable>
          </Appear>
        </View>
      ) : null}
      {/* Celebración: confeti al descubrir la parada. */}
      {place ? <InkConfetti key={`confeti-${place.id}`} /> : null}
    </Modal>
  );
}

// Audio automático: el audio de la parada empieza solo, después del sonido
// de descubrimiento. Se puede pausar; al cerrar la tarjeta se detiene.
function AutoAudio({ uri, title, onTime }: { uri: string; title: string | null; onTime: (seconds: number) => void }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const { placeVolume } = useSettings();
  const player = useAudioPlayer(uri);
  const status = useAudioPlayerStatus(player);
  const started = useRef(false);

  useEffect(() => {
    setPlayerVolume(player, placeVolume);
  }, [player, placeVolume]);

  useEffect(() => {
    if (started.current || !status.isLoaded) return;
    started.current = true;
    const timer = setTimeout(() => player.play(), 1200);
    return () => clearTimeout(timer);
  }, [status.isLoaded, player]);

  useEffect(() => {
    onTime(status.currentTime);
  }, [status.currentTime, onTime]);

  useEffect(
    () => () => {
      try {
        player.pause();
      } catch {
        // El reproductor puede estar ya liberado.
      }
    },
    [player]
  );

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={status.playing ? 'Pausar audio' : 'Reproducir audio'}
      onPress={() => (status.playing ? player.pause() : player.play())}
      style={styles.audioRow}
    >
      <View style={styles.audioButton}>
        <Ionicons name={status.playing ? 'pause' : 'play'} size={18} color={colors.onPrimary} />
      </View>
      <View style={styles.grow}>
        <Txt variant="label" numberOfLines={1}>
          {title ?? 'Escucha este lugar'}
        </Txt>
        <Txt variant="caption">{status.playing ? 'Sonando' : status.isLoaded ? 'En pausa' : 'Cargando…'}</Txt>
      </View>
    </Pressable>
  );
}

const useStyles = makeStyles((colors) => ({
  grow: { flex: 1 },
  audio: { alignSelf: 'stretch' },
  audioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.m - 4,
    padding: space.s + 2,
    backgroundColor: colors.panel,
    borderRadius: radius.pill,
  },
  audioButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
  },
  backdrop: { flex: 1, backgroundColor: 'rgba(21, 21, 26, 0.45)' },
  sheet: {
    backgroundColor: colors.surface,
    paddingHorizontal: space.l,
    paddingTop: space.s + 2,
    gap: space.m,
    alignItems: 'center',
    borderTopLeftRadius: radius.l + 4,
    borderTopRightRadius: radius.l + 4,
  },
  handle: { width: 48, height: 5, backgroundColor: colors.border, borderRadius: radius.pill },
  close: {
    position: 'absolute',
    right: space.m,
    top: space.m,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.panel,
    borderRadius: radius.pill,
  },
  art: { width: 280, height: 250, alignItems: 'center', justifyContent: 'center', marginTop: space.s },
  sparkleA: { position: 'absolute', left: 8, top: 20 },
  sparkleB: { position: 'absolute', right: 14, bottom: 30 },
  postcard: {
    width: 180,
    padding: space.s,
    gap: space.s,
    backgroundColor: '#FFFFFF',
    borderRadius: radius.s + 4,
    boxShadow: '0px 12px 26px #15151A33',
  },
  photo: { height: 160, borderRadius: radius.s },
  caption: { textAlign: 'center', color: '#15151A' },
  tag: { position: 'absolute', right: 0, top: 8 },
  tagInner: { paddingHorizontal: space.m - 2, paddingVertical: space.s - 1, backgroundColor: colors.primary, borderRadius: radius.pill },
  seal: { position: 'absolute', right: -6, bottom: 44 },
  sealInner: {
    width: 84,
    height: 84,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.primaryText,
    borderRadius: radius.pill,
  },
  sealSmall: { fontFamily: fonts.display, fontSize: 12, lineHeight: 14, color: colors.primaryText },
  sealBig: { fontFamily: fonts.display, fontSize: 28, lineHeight: 30, color: colors.primaryText },
  texts: { alignSelf: 'stretch', gap: space.s },
  title: { textAlign: 'center', fontSize: 34, lineHeight: 38 },
  center: { textAlign: 'center' },
  soft: { color: colors.textMuted },
  stamps: { marginTop: space.xs },
  actions: { alignSelf: 'stretch', gap: space.xs, marginTop: space.s },
  secondary: { alignItems: 'center', paddingVertical: space.m - 4 },
}));
