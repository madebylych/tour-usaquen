import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import Button from '@/components/Button';
import Passport from '@/components/Passport';
import StateMessage from '@/components/StateMessage';
import Txt from '@/components/Txt';
import { countDiscovered, progress, useProgress } from '@/data/progress';
import { getRoute } from '@/data/source';
import { useData } from '@/data/useData';
import { colors, radius, space } from '@/theme';

// Final del recorrido: resumen del pasaporte y créditos.
export default function CompleteScreen() {
  const insets = useSafeAreaInsets();
  const { route: slug } = useLocalSearchParams<{ route: string }>();
  const state = useData(() => getRoute(slug), slug);
  const { discovered } = useProgress();

  if (state.status === 'loading') return <StateMessage loading />;
  if (state.status === 'error' || !state.data) return <StateMessage message="No se pudo cargar el resumen." />;
  const route = state.data;

  const ids = route.places.map((p) => p.id);
  const done = countDiscovered(ids, discovered);
  const complete = done === ids.length;

  const confirmReset = () =>
    Alert.alert(
      'Reiniciar recorrido',
      'Se borrarán las paradas descubiertas de este recorrido para empezar de nuevo.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Reiniciar',
          style: 'destructive',
          onPress: () => {
            progress.reset(ids);
            router.dismissAll();
          },
        },
      ]
    );

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + space.xl, paddingBottom: insets.bottom + space.l },
        ]}
      >
        <View style={styles.medal}>
          <Ionicons name={complete ? 'ribbon' : 'footsteps'} size={60} color={colors.primary} />
        </View>
        <Txt variant="display" color={colors.onPrimary} style={styles.center}>
          {complete ? '¡Recorrido completado!' : '¡Buen recorrido!'}
        </Txt>
        <Txt variant="body" color={colors.onPrimary} style={[styles.center, styles.soft]}>
          {complete
            ? 'Descubriste todas las paradas. Gracias por caminar y escuchar Usaquén con nosotros.'
            : `Descubriste ${done} de ${ids.length} paradas. Puedes volver cuando quieras a completar el pasaporte.`}
        </Txt>

        <Passport places={route.places} discovered={discovered} onPrimary />

        <View style={styles.credits}>
          <Txt variant="caption" color={colors.onPrimary}>
            CRÉDITOS
          </Txt>
          <Txt variant="body" color={colors.onPrimary} style={styles.soft}>
            Un proyecto interdisciplinar de Creación Digital, Arquitectura y Música.
          </Txt>
        </View>

        <View style={styles.actions}>
          <Button label="Volver al inicio" variant="light" onPress={() => router.dismissAll()} />
          <Pressable onPress={confirmReset} style={styles.reset} accessibilityRole="button">
            <Txt variant="label" color={colors.onPrimary} style={styles.soft}>
              Reiniciar recorrido
            </Txt>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.primary },
  content: { paddingHorizontal: space.l, gap: space.m, alignItems: 'stretch' },
  medal: {
    alignSelf: 'center',
    width: 120,
    height: 120,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space.s,
  },
  center: { textAlign: 'center' },
  soft: { opacity: 0.9 },
  credits: {
    gap: space.xs,
    paddingTop: space.m,
    borderTopWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  actions: { gap: space.xs, marginTop: space.m },
  reset: { alignItems: 'center', paddingVertical: space.m - 2 },
});
