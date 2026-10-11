import { Image, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import { makeStyles, useTheme } from '@/theme';

const TRAMA = require('../../assets/images/trama.png');
const TRAMA_OSCURO = require('../../assets/images/trama_oscuro.png');

type Props = {
  uri?: string | null; // foto (archivo descargado o URL); si falta, se muestra la trama
  style?: StyleProp<ViewStyle>;
  label?: string; // descripción para lectores de pantalla
};

// Foto de un lugar o ruta, tal cual. Sin foto se ve una trama de puntos de
// risografía (generada con scripts/generar_trama.py), así el espacio nunca
// se ve roto.
export default function MediaImage({ uri, style, label }: Props) {
  const styles = useStyles();
  const { dark } = useTheme();
  return (
    <View style={[styles.box, style]} accessibilityRole="image" accessibilityLabel={label ?? 'Imagen'}>
      <Image
        source={uri ? { uri } : dark ? TRAMA_OSCURO : TRAMA}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
      />
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  box: { backgroundColor: colors.primarySoft, overflow: 'hidden' },
}));
