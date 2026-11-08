import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import MediaImage from '@/components/MediaImage';
import { Stamp } from '@/components/motion';
import Txt from '@/components/Txt';
import { PlaceWithMedia } from '@/types';
import { fonts, makeStyles, radius, useTheme } from '@/theme';

// Pasteles de las casillas que faltan por llenar.
const PASTELS = ['#E9DDFB', '#FFE0E8', '#DDF3E0', '#D9ECFB', '#FFF0C7'];

type Props = {
  places: PlaceWithMedia[];
  discovered: Record<string, number>;
  size?: number;
  overlap?: number; // cuánto se monta cada círculo sobre el anterior
  animate?: boolean; // los descubiertos se estampan uno tras otro
};

// Sellos de la ruta en fila, montados unos sobre otros: la foto de la parada
// si ya se descubrió, un círculo pastel con su número si falta.
export default function PlaceStamps({ places, discovered, size = 44, overlap = 10, animate = false }: Props) {
  const styles = useStyles();
  const { colors } = useTheme();
  const done = places.filter((p) => p.id in discovered).length;
  return (
    <View
      style={styles.row}
      accessible
      accessibilityLabel={`${done} de ${places.length} sellos`}
    >
      {places.map((place, index) => {
        const isDone = place.id in discovered;
        const circle = { width: size, height: size, marginLeft: index === 0 ? 0 : -overlap };
        const content = isDone ? (
          <View style={[styles.circle, circle]}>
            <MediaImage uri={place.media.image} style={styles.fill} />
            {place.media.image ? null : (
              <View style={styles.check}>
                <Ionicons name="checkmark" size={size * 0.45} color={colors.primaryText} />
              </View>
            )}
          </View>
        ) : (
          <View style={[styles.circle, circle, { backgroundColor: PASTELS[index % PASTELS.length] }]}>
            <Txt style={[styles.number, { fontSize: size * 0.4 }]}>{index + 1}</Txt>
          </View>
        );
        return animate && isDone ? (
          <Stamp key={place.id} delay={200 + index * 90} rotate={index % 2 ? '6deg' : '-6deg'}>
            {content}
          </Stamp>
        ) : (
          <View key={place.id}>{content}</View>
        );
      })}
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  row: { flexDirection: 'row', alignItems: 'center' },
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: colors.surface,
    borderRadius: radius.pill,
  },
  fill: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  check: { ...{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primarySoft },
  number: { fontFamily: fonts.display, color: '#8A8794' },
}));
