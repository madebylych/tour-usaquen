import { Animated, ImageSourcePropType, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import { useDrift } from '@/components/motion';
import { makeStyles, useTheme } from '@/theme';

const TRAMA = require('../../assets/images/trama.png');
const TRAMA_OSCURO = require('../../assets/images/trama_oscuro.png');

type Props = {
  uri?: string | null; // foto (archivo descargado o URL); si falta, se muestra la trama
  style?: StyleProp<ViewStyle>;
  label?: string; // descripción para lectores de pantalla
  drift?: boolean; // la foto se acerca lentamente sin parar (portadas)
};

// Foto de un lugar o ruta, tal cual. Sin foto se ve una trama de puntos de
// risografía (generada con scripts/generar_trama.py), así el espacio nunca
// se ve roto.
export default function MediaImage({ uri, style, label, drift = false }: Props) {
  const styles = useStyles();
  const { dark } = useTheme();
  const source = uri ? { uri } : dark ? TRAMA_OSCURO : TRAMA;
  return (
    <View style={[styles.box, style]} accessibilityRole="image" accessibilityLabel={label ?? 'Imagen'}>
      {drift ? (
        <DriftImage source={source} />
      ) : (
        <Animated.Image source={source} style={StyleSheet.absoluteFill} resizeMode="cover" />
      )}
    </View>
  );
}

// Aparte para que solo las portadas tengan el movimiento corriendo.
function DriftImage({ source }: { source: ImageSourcePropType }) {
  const scale = useDrift();
  return <Animated.Image source={source} style={[StyleSheet.absoluteFill, { transform: [{ scale }] }]} resizeMode="cover" />;
}

const useStyles = makeStyles((colors) => ({
  box: { backgroundColor: colors.primarySoft, overflow: 'hidden' },
}));
