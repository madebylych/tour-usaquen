import { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import BackButton from '@/components/BackButton';
import Button from '@/components/Button';
import Field from '@/components/Field';
import InkLoader from '@/components/InkLoader';
import StateMessage from '@/components/StateMessage';
import Txt from '@/components/Txt';
import { AdminRoute, loadAdminRoutes, reorderPlaces, saveRoute } from '@/data/admin';
import { useAuth } from '@/data/auth';
import { line, makeStyles, space, useTheme } from '@/theme';

// Panel de administración: rutas y paradas (incluidas las no publicadas).
// Solo se muestra a admins; aunque alguien llegara aquí sin serlo, la base
// de datos rechaza cualquier cambio.
export default function AdminScreen() {
  const auth = useAuth();
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const [routes, setRoutes] = useState<AdminRoute[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(() => {
    setError(null);
    loadAdminRoutes()
      .then(setRoutes)
      .catch((e: Error) => setError(e.message));
  }, []);

  // Al volver de editar una parada, se recarga la lista.
  useFocusEffect(reload);

  if (auth.status !== 'signedIn' || !auth.isAdmin)
    return <StateMessage message="Esta sección es solo para administración." showHomeButton />;
  if (error) return <StateMessage message={error} onRetry={reload} showHomeButton />;

  return (
    <View style={styles.screen}>
      <BackButton />
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + space.xl + space.l, paddingBottom: insets.bottom + space.xl },
        ]}
      >
        <Txt variant="title" riso>
          Administración
        </Txt>
        <Txt variant="caption">
          Los cambios se publican al guardar. Quien tenga el recorrido descargado verá «Actualizar».
        </Txt>
        {routes === null ? (
          <View style={styles.loading}>
            <InkLoader />
          </View>
        ) : (
          routes.map((route) => <RouteEditor key={route.id} route={route} onChanged={reload} />)
        )}
      </ScrollView>
    </View>
  );
}

function RouteEditor({ route, onChanged }: { route: AdminRoute; onChanged: () => void }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const [name, setName] = useState(route.name);
  const [description, setDescription] = useState(route.description ?? '');
  const [duration, setDuration] = useState(route.duration_min?.toString() ?? '');
  const [distance, setDistance] = useState(route.distance_m?.toString() ?? '');
  const [saving, setSaving] = useState(false);

  const run = async (action: () => Promise<void>) => {
    setSaving(true);
    try {
      await action();
      onChanged();
    } catch (e) {
      Alert.alert('No se pudo guardar', (e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const save = () =>
    run(() =>
      saveRoute(route.id, {
        name: name.trim(),
        description: description.trim() || null,
        duration_min: duration ? Number(duration) : null,
        distance_m: distance ? Number(distance) : null,
      })
    );

  const togglePublished = () => run(() => saveRoute(route.id, { published: !route.published }));

  const move = (index: number, delta: number) => {
    const ids = route.places.map((p) => p.id);
    const target = index + delta;
    if (target < 0 || target >= ids.length) return;
    [ids[index], ids[target]] = [ids[target], ids[index]];
    run(() => reorderPlaces(route.id, ids));
  };

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Txt variant="overline">RUTA, VERSIÓN {route.version}</Txt>
        <Pressable onPress={togglePublished} style={[styles.badge, route.published && styles.badgeOn]}>
          <Txt variant="caption" color={route.published ? colors.onAccent : colors.text}>
            {route.published ? 'Publicada' : 'Oculta'}
          </Txt>
        </Pressable>
      </View>
      <Field label="Nombre" value={name} onChangeText={setName} />
      <Field label="Descripción" value={description} onChangeText={setDescription} multiline />
      <View style={styles.row}>
        <View style={styles.grow}>
          <Field label="Duración (min)" value={duration} onChangeText={setDuration} keyboardType="number-pad" />
        </View>
        <View style={styles.grow}>
          <Field label="Distancia (m)" value={distance} onChangeText={setDistance} keyboardType="number-pad" />
        </View>
      </View>
      <Button label={saving ? 'Guardando…' : 'Guardar ruta'} icon="save-outline" onPress={saving ? () => {} : save} />

      <Txt variant="heading" style={styles.stopsTitle}>
        Paradas
      </Txt>
      {route.places.map((place, index) => (
        <View key={place.id} style={styles.stop}>
          <Txt variant="label" color={colors.primary} style={styles.stopNumber}>
            {String(index + 1).padStart(2, '0')}
          </Txt>
          <Pressable
            style={styles.grow}
            accessibilityRole="button"
            onPress={() => router.push({ pathname: '/admin/parada', params: { id: place.id, route: route.id } })}
          >
            <Txt variant="label" numberOfLines={1}>
              {place.name}
            </Txt>
            <Txt variant="caption">{place.published ? place.category : `${place.category}, oculta`}</Txt>
          </Pressable>
          <Pressable onPress={() => move(index, -1)} hitSlop={6} accessibilityLabel="Subir" style={styles.arrow}>
            <Ionicons name="arrow-up" size={18} color={index === 0 ? colors.textMuted : colors.text} />
          </Pressable>
          <Pressable onPress={() => move(index, 1)} hitSlop={6} accessibilityLabel="Bajar" style={styles.arrow}>
            <Ionicons
              name="arrow-down"
              size={18}
              color={index === route.places.length - 1 ? colors.textMuted : colors.text}
            />
          </Pressable>
        </View>
      ))}
      <Button
        label="Nueva parada"
        variant="secondary"
        icon="add"
        onPress={() => router.push({ pathname: '/admin/parada', params: { route: route.id } })}
      />
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: space.m + 6, gap: space.m },
  loading: { alignItems: 'center', paddingVertical: space.xl },
  card: {
    gap: space.m - 2,
    padding: space.m + 2,
    backgroundColor: colors.surface,
    borderWidth: line,
    borderColor: colors.border,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  badge: { paddingVertical: space.xs, paddingHorizontal: space.s + 2, borderWidth: line, borderColor: colors.border },
  badgeOn: { backgroundColor: colors.accent },
  row: { flexDirection: 'row', gap: space.m - 4 },
  grow: { flex: 1 },
  stopsTitle: { marginTop: space.s },
  stop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.m - 4,
    paddingVertical: space.s,
    borderTopWidth: line,
    borderColor: colors.border,
  },
  stopNumber: { width: 26 },
  arrow: { padding: space.xs },
}));
