import { Modal, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import Button from '@/components/Button';
import InkConfetti from '@/components/InkConfetti';
import MediaImage from '@/components/MediaImage';
import { Appear, Stamp, Wobble } from '@/components/motion';
import PlaceStamps from '@/components/PlaceStamps';
import Txt from '@/components/Txt';
import { progress, useProgress } from '@/data/progress';
import { PlaceWithMedia } from '@/types';
import { fonts, makeStyles, radius, space, useTheme } from '@/theme';

type Props = {
  places: PlaceWithMedia[]; // paradas de la ruta actual
  onOpen: (placeId: string) => void;
};

// Hoja de "¡Descubriste!" que sube desde abajo al descubrir una parada: la
// postal del lugar con su etiqueta y su sello, el titular y la fila de
// sellos de la ruta. Si se descubren varias a la vez, salen una tras otra.
export default function DiscoveryCard({ places, onOpen }: Props) {
  const { colors } = useTheme();
  const styles = useStyles();
  const { announcements, discovered } = useProgress();
  const insets = useSafeAreaInsets();

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

          <Appear delay={560} style={styles.stamps}>
            <PlaceStamps places={places} discovered={discovered} size={46} overlap={8} />
          </Appear>

          <Appear delay={640} style={styles.actions}>
            <Button
              label="Ver la parada"
              onPress={() => {
                progress.dismissAnnouncement();
                onOpen(place.id);
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

const useStyles = makeStyles((colors) => ({
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
