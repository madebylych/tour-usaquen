import { Image, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '@/theme';
import { categoryIcon } from '@/utils/categories';

type Props = {
  uri?: string | null; // foto (archivo descargado o URL); si falta, se muestra un ícono
  category?: string;
  iconSize?: number;
  style?: StyleProp<ViewStyle>;
  label?: string; // descripción para lectores de pantalla
};

// Foto de un lugar o ruta. Sin foto, un fondo rosado con el ícono de la
// categoría para que el espacio no se vea roto.
export default function MediaImage({ uri, category, iconSize = 40, style, label }: Props) {
  return (
    <View style={[styles.box, style]} accessibilityRole="image" accessibilityLabel={label ?? 'Imagen'}>
      {uri ? (
        <Image source={{ uri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
      ) : (
        <Ionicons
          name={category ? categoryIcon(category) : 'image'}
          size={iconSize}
          color={colors.primary}
          style={styles.icon}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  icon: { opacity: 0.55 },
});
