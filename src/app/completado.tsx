import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import Button from '@/components/Button';
import Txt from '@/components/Txt';
import { colors, radius, space } from '@/theme';

// Final del recorrido. El pasaporte y los créditos llegan en la fase 5.
export default function CompleteScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.screen, { paddingTop: insets.top, paddingBottom: insets.bottom + space.l }]}>
      <StatusBar style="light" />
      <View style={styles.center}>
        <View style={styles.medal}>
          <Ionicons name="ribbon" size={64} color={colors.primary} />
        </View>
        <Txt variant="display" color={colors.onPrimary} style={styles.centerText}>
          ¡Recorrido completado!
        </Txt>
        <Txt variant="body" color={colors.onPrimary} style={[styles.centerText, styles.soft]}>
          Gracias por caminar y escuchar Usaquén con nosotros.
        </Txt>
      </View>
      <Button label="Volver al inicio" variant="light" onPress={() => router.dismissAll()} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.primary,
    paddingHorizontal: space.l,
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.m },
  medal: {
    width: 128,
    height: 128,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space.m,
  },
  centerText: { textAlign: 'center' },
  soft: { opacity: 0.9 },
});
