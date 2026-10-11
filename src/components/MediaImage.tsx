import { Animated, ImageSourcePropType, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import { useDrift } from '@/components/motion';
import { makeStyles, useTheme } from '@/theme';

const TRAMA = require('../../assets/images/trama.png');

type Props = {
  uri?: string | null; // foto (archivo descargado o URL); si falta, se muestra la trama
  style?: StyleProp<ViewStyle>;
  label?: string; // descripción para lectores de pantalla
  drift?: boolean; // la foto se acerca lentamente sin parar (portadas)
};

// Foto de un lugar o ruta, tal cual. Sin foto se ve una trama de puntos de
// risografía (scripts/generar_trama.py) en el color principal elegido, así
// el espacio nunca se ve roto.
export default function MediaImage({ uri, style, label, drift = false }: Props) {
  const styles = useStyles();
  const { colors } = useTheme();
  // Sin foto: trama de puntos pintada con el color principal elegido.
  const source = uri ? { uri } : TRAMA;
  const tint = uri ? undefined : colors.primary;
  return (
    <View style={[styles.box, style]} accessibilityRole="image" accessibilityLabel={label ?? 'Imagen'}>
      {drift ? (
        <DriftImage source={source} tint={tint} />
      ) : (
        <Animated.Image source={source} style={[StyleSheet.absoluteFill, tint ? { tintColor: tint } : null]} resizeMode="cover" />
      )}
    </View>
  );
}

// Aparte para que solo las portadas tengan el movimiento corriendo.
function DriftImage({ source, tint }: { source: ImageSourcePropType; tint?: string }) {
  const scale = useDrift();
  return (
    <Animated.Image
      source={source}
      style={[StyleSheet.absoluteFill, tint ? { tintColor: tint } : null, { transform: [{ scale }] }]}
      resizeMode="cover"
    />
  );
}

const useStyles = makeStyles((colors) => ({
  box: { backgroundColor: colors.primarySoft, overflow: 'hidden' },
}));
