import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '@/theme';
import { categoryIcon } from '@/utils/categories';

type Props = {
  category?: string;
  iconSize?: number;
  style?: StyleProp<ViewStyle>;
};

// Ocupa el lugar de la foto mientras no hay imágenes (llegan en la fase 7).
export default function ImagePlaceholder({ category, iconSize = 40, style }: Props) {
  return (
    <View style={[styles.box, style]} accessibilityLabel="Imagen pendiente">
      <Ionicons
        name={category ? categoryIcon(category) : 'image'}
        size={iconSize}
        color={colors.primary}
        style={styles.icon}
      />
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
