import { Image, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import { makeStyles, useTheme } from '@/theme';

const TRAMA = require('../../assets/images/trama.png');
const TRAMA_OSCURO = require('../../assets/images/trama_oscuro.png');
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
  const styles = useStyles();
  const { dark } = useTheme();
  return (
    <View style={[styles.box, style]} accessibilityRole="image" accessibilityLabel={label ?? 'Imagen'}>
      {uri ? (
        <>
          <Image source={{ uri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
          <Image source={TRAMA_OVERLAY} style={styles.overlay} resizeMode="stretch" />
        </>
      ) : (
        <Image source={dark ? TRAMA_OSCURO : TRAMA} style={StyleSheet.absoluteFill} resizeMode="cover" />
      )}
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  box: { backgroundColor: colors.primarySoft, overflow: 'hidden' },
  // Trama sobre fotos: se ve, pero la foto se sigue leyendo. Va a su tamaño
  // natural (2048x1024, ya repetida) y la caja recorta lo que sobra.
  overlay: { position: 'absolute', top: 0, left: 0, width: 2048, height: 1024, opacity: 0.4 },
}));
