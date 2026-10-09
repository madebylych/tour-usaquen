import { Pressable, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { colors, line, space } from '@/theme';

// Botón circular flotante para volver, sobre imágenes a pantalla completa.
export default function BackButton() {
  const insets = useSafeAreaInsets();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Volver"
      // Si la app se abrió directo en esta pantalla no hay a dónde volver.
      onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
      hitSlop={8}
      style={[styles.button, { top: insets.top + space.s }]}
    >
      <Ionicons name="arrow-back" size={22} color={colors.text} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    left: space.m,
    zIndex: 10,
    width: 42,
    height: 42,
    backgroundColor: colors.surface,
    borderWidth: line,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
