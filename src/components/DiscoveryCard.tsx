import { Modal, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import Button from '@/components/Button';
import InkConfetti from '@/components/InkConfetti';
import { Appear, Stamp } from '@/components/motion';
import Txt from '@/components/Txt';
import { progress, useProgress } from '@/data/progress';
import { Place } from '@/types';
import { line, makeStyles, radius, space, useTheme } from '@/theme';
import { categoryIcon } from '@/utils/categories';

type Props = {
  places: Place[]; // paradas de la ruta actual
  onOpen: (placeId: string) => void;
};

// Tarjeta de "¡Descubriste!" que sube desde abajo al descubrir una parada.
// Si se descubren varias a la vez, se muestran una tras otra. El ícono cae
// como un sello y los textos se imprimen detrás.
export default function DiscoveryCard({ places, onOpen }: Props) {
  const { colors } = useTheme();
  const styles = useStyles();
  const { announcements } = useProgress();
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
        <View key={place.id} style={[styles.sheet, { paddingBottom: insets.bottom + space.l }]}>
          <Stamp delay={250} rotate="8deg" style={styles.iconSpace}>
            <View style={styles.icon}>
              <Ionicons name={categoryIcon(place.category)} size={34} color={colors.text} />
            </View>
          </Stamp>
          <Appear delay={420} style={styles.texts}>
            <Txt variant="overline" color={colors.onAccent} style={styles.center}>
              PARADA {position} DESCUBIERTA
            </Txt>
            <Txt variant="title" color={colors.onAccent} style={styles.center}>
              ¡Descubriste {place.name}!
            </Txt>
            {place.observation_prompt ? (
              <Txt variant="body" color={colors.onAccent} style={[styles.center, styles.soft]}>
                {place.observation_prompt}
              </Txt>
            ) : null}
          </Appear>
          <Appear delay={560} style={styles.actions}>
            <Button
              label="Ver parada"
              onPress={() => {
                progress.dismissAnnouncement();
                onOpen(place.id);
              }}
            />
            <Pressable onPress={progress.dismissAnnouncement} style={styles.secondary} accessibilityRole="button">
              <Txt variant="label" color={colors.onAccent}>
                Seguir explorando
              </Txt>
            </Pressable>
          </Appear>
        </View>
      ) : null}
      {/* Celebración: recortes de tinta que caen al descubrir la parada. */}
      {place ? <InkConfetti key={`confeti-${place.id}`} /> : null}
    </Modal>
  );
}

const useStyles = makeStyles((colors) => ({
  backdrop: { flex: 1, backgroundColor: 'rgba(21, 21, 26, 0.5)' },
  sheet: {
    backgroundColor: colors.accent,
    borderTopWidth: line,
    borderColor: colors.border,
    paddingHorizontal: space.l,
    paddingTop: space.xl,
    gap: space.m - 4,
    alignItems: 'center',
    borderTopLeftRadius: radius.l,
    borderTopRightRadius: radius.l,
  },
  icon: {
    width: 86,
    height: 86,
    backgroundColor: colors.surface,
    borderWidth: line + 0.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.l,
  },
  iconSpace: { marginBottom: space.m },
  texts: { alignSelf: 'stretch', gap: space.m - 4 },
  center: { textAlign: 'center' },
  soft: { opacity: 0.92 },
  actions: { alignSelf: 'stretch', gap: space.s, marginTop: space.m },
  secondary: { alignItems: 'center', paddingVertical: space.m - 2 },
}));
