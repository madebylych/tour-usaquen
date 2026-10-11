import { Alert, Pressable, ScrollView, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import Button from '@/components/Button';
import InkConfetti from '@/components/InkConfetti';
import { Appear, Stamp } from '@/components/motion';
import Passport from '@/components/Passport';
import StateMessage from '@/components/StateMessage';
import Txt from '@/components/Txt';
import { countDiscovered, progress, useProgress } from '@/data/progress';
import { getRoute } from '@/data/source';
import { useData } from '@/data/useData';
import { line, makeStyles, space, useTheme } from '@/theme';

// Final del recorrido: resumen del pasaporte y créditos.
export default function CompleteScreen() {
  const { colors } = useTheme();
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const { route: slug } = useLocalSearchParams<{ route: string }>();
  const state = useData(() => getRoute(slug), slug);
  const { discovered } = useProgress();

  if (!slug) return <StateMessage message="No se sabe qué recorrido resumir." showHomeButton />;
  if (state.status === 'loading') return <StateMessage loading />;
  if (state.status === 'error' || !state.data)
    return <StateMessage message="No se pudo cargar el resumen." onRetry={state.reload} showHomeButton />;
  const route = state.data;

  const ids = route.places.map((p) => p.id);
  const done = countDiscovered(ids, discovered);
  const complete = done === ids.length;

  // Cierra las pantallas hasta el inicio; si el inicio no está en la pila
  // (la app se abrió directo aquí), lo pone en su lugar.
  const goHome = () => router.dismissTo('/');

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
            goHome();
          },
        },
      ]
    );

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + space.xl, paddingBottom: insets.bottom + space.l },
        ]}
      >
        <Stamp delay={200} rotate="-7deg" style={styles.medalSpace}>
          <View style={styles.medal}>
            <Ionicons name={complete ? 'sparkles' : 'footsteps'} size={56} color={colors.onAccent} />
          </View>
        </Stamp>
        <Txt variant="display" riso style={styles.center}>
          {complete ? '¡Recorrido completado!' : '¡Buen recorrido!'}
        </Txt>
        <Txt variant="body" style={styles.center}>
          {complete
            ? `Descubriste las ${ids.length} paradas. Gracias por caminar y escuchar Usaquén con nosotros.`
            : `Descubriste ${done} de ${ids.length} paradas. Puedes volver cuando quieras a completar el pasaporte.`}
        </Txt>

        <Appear delay={300}>
          <Passport places={route.places} discovered={discovered} />
        </Appear>

        <Appear delay={450} style={styles.credits}>
          <Txt variant="overline">CRÉDITOS</Txt>
          <Txt variant="body">Un proyecto interdisciplinar de Creación Digital, Arquitectura y Música.</Txt>
        </Appear>

        <View style={styles.actions}>
          <Button label="Volver al inicio" onPress={goHome} />
          <Pressable onPress={confirmReset} style={styles.reset} accessibilityRole="button">
            <Txt variant="label" color={colors.textMuted}>
              Reiniciar recorrido
            </Txt>
          </Pressable>
        </View>
      </ScrollView>
      {complete ? <InkConfetti /> : null}
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: space.l, gap: space.m + 4, alignItems: 'stretch' },
  medal: {
    width: 120,
    height: 120,
    backgroundColor: colors.accent,
    borderWidth: line + 0.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  medalSpace: { alignSelf: 'center', marginBottom: space.s },
  center: { textAlign: 'center' },
  credits: { gap: space.xs },
  actions: { gap: space.xs, marginTop: space.s },
  reset: { alignItems: 'center', paddingVertical: space.m - 2 },
}));
