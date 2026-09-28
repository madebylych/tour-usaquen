import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import Button from '@/components/Button';
import Txt from '@/components/Txt';
import { progress, useProgress } from '@/data/progress';
import { Place } from '@/types';
import { colors, radius, space } from '@/theme';
import { categoryIcon } from '@/utils/categories';

type Props = {
  places: Place[]; // paradas de la ruta actual
  onOpen: (placeId: string) => void;
};

// Tarjeta de "¡Descubriste!" que sube desde abajo al descubrir una parada.
// Si se descubren varias a la vez, se muestran una tras otra.
export default function DiscoveryCard({ places, onOpen }: Props) {
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
        <View style={[styles.sheet, { paddingBottom: insets.bottom + space.l }]}>
          <View style={styles.icon}>
            <Ionicons name={categoryIcon(place.category)} size={36} color={colors.primary} />
          </View>
          <Txt variant="caption" color={colors.onPrimary} style={styles.center}>
            PARADA {position} DESCUBIERTA
          </Txt>
          <Txt variant="display" color={colors.onPrimary} style={styles.center}>
            ¡Descubriste {place.name}!
          </Txt>
          {place.observation_prompt ? (
            <Txt variant="body" color={colors.onPrimary} style={[styles.center, styles.soft]}>
              {place.observation_prompt}
            </Txt>
          ) : null}
          <View style={styles.actions}>
            <Button
              label="Ver parada"
              icon="arrow-forward"
              variant="light"
              onPress={() => {
                progress.dismissAnnouncement();
                onOpen(place.id);
              }}
            />
            <Pressable onPress={progress.dismissAnnouncement} style={styles.secondary} accessibilityRole="button">
              <Txt variant="label" color={colors.onPrimary}>
                Seguir explorando
              </Txt>
            </Pressable>
          </View>
        </View>
      ) : null}
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(28, 27, 31, 0.45)' },
  sheet: {
    backgroundColor: colors.primary,
    borderTopLeftRadius: radius.l + 8,
    borderTopRightRadius: radius.l + 8,
    paddingHorizontal: space.l,
    paddingTop: space.xl,
    gap: space.m - 4,
    alignItems: 'center',
  },
  icon: {
    width: 80,
    height: 80,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space.s,
  },
  center: { textAlign: 'center' },
  soft: { opacity: 0.92 },
  actions: { alignSelf: 'stretch', gap: space.s, marginTop: space.m },
  secondary: { alignItems: 'center', paddingVertical: space.m - 2 },
});
