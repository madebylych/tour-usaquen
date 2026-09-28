import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import Txt from '@/components/Txt';
import { Coordinates } from '@/geo/distance';
import { Place } from '@/types';
import { colors, space } from '@/theme';

type Props = {
  places: Place[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  userPosition: Coordinates | null;
  userAccuracy: number | null;
  simulated: boolean;
  onMapPress: (coordinate: Coordinates) => void;
};

// react-native-maps no funciona en web. La versión web no es parte del MVP,
// así que aquí solo se muestra un aviso.
export default function TourMap(_props: Props) {
  return (
    <View style={[StyleSheet.absoluteFill, styles.box]}>
      <Ionicons name="map-outline" size={48} color={colors.primary} />
      <Txt variant="caption" color={colors.primary}>
        El mapa está disponible en la app para Android y iPhone.
      </Txt>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.s,
    padding: space.l,
  },
});
