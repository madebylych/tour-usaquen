import { Animated, Pressable } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useHover } from '@/components/motion';
import { line, makeStyles, space, useTheme } from '@/theme';

// Botón circular flotante para volver, sobre imágenes a pantalla completa.
export default function BackButton() {
  const { colors } = useTheme();
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const hover = useHover();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Volver"
      // Si la app se abrió directo en esta pantalla no hay a dónde volver.
      onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
      {...hover.handlers}
      hitSlop={8}
      style={[styles.button, { top: insets.top + space.s }]}
    >
      {/* Con hover la flecha apunta más hacia atrás. */}
      <Animated.View style={{ transform: [{ translateX: hover.value.interpolate({ inputRange: [0, 1], outputRange: [0, -4] }) }] }}>
        <Ionicons name="arrow-back" size={22} color={colors.text} />
      </Animated.View>
    </Pressable>
  );
}

const useStyles = makeStyles((colors) => ({
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
}));
