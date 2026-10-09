import { Image, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import { colors } from '@/theme';

const TRAMA = require('../../assets/images/trama.png');
const TRAMA_OVERLAY = require('../../assets/images/trama_overlay.png');

type Props = {
  uri?: string | null; // foto (archivo descargado o URL); si falta, se muestra la trama
  style?: StyleProp<ViewStyle>;
  label?: string; // descripción para lectores de pantalla
};

// Foto de un lugar o ruta con estética de risografía: encima de la foto va
// una trama de puntos azules; sin foto, se ve solo la trama (generada con
// scripts/generar_trama.py), así el espacio nunca se ve roto.
export default function MediaImage({ uri, style, label }: Props) {
  return (
    <View style={[styles.box, style]} accessibilityRole="image" accessibilityLabel={label ?? 'Imagen'}>
      {uri ? (
        <>
          <Image source={{ uri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
          <Image source={TRAMA_OVERLAY} style={[StyleSheet.absoluteFill, styles.overlay]} resizeMode="repeat" />
        </>
      ) : (
        <Image source={TRAMA} style={StyleSheet.absoluteFill} resizeMode="cover" />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { backgroundColor: colors.primarySoft, overflow: 'hidden' },
  overlay: { opacity: 0.22 },
});
