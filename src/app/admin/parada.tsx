import { useEffect, useRef, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as Location from 'expo-location';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import BackButton from '@/components/BackButton';
import Button from '@/components/Button';
import Field from '@/components/Field';
import MediaImage from '@/components/MediaImage';
import StateMessage from '@/components/StateMessage';
import Txt from '@/components/Txt';
import { deletePlace, loadPlace, MediaKind, pickAndUpload, PlaceDraft, removeMedia, savePlace, slugify } from '@/data/admin';
import { useAuth } from '@/data/auth';
import { mediaUrl } from '@/data/remote';
import { Place } from '@/types';
import { line, makeStyles, radius, space, useTheme } from '@/theme';

// Campos de texto del formulario (todos como texto para editarlos).
type Form = {
  name: string;
  category: string;
  latitude: string;
  longitude: string;
  activation_radius: string;
  summary: string;
  observation_prompt: string;
  history: string;
  architecture: string;
  did_you_know: string;
  image_credit: string;
  audio_title: string;
  audio_credit: string;
  sources: string;
};

const EMPTY: Form = {
  name: '',
  category: '',
  latitude: '',
  longitude: '',
  activation_radius: '30',
  summary: '',
  observation_prompt: '',
  history: '',
  architecture: '',
  did_you_know: '',
  image_credit: '',
  audio_title: '',
  audio_credit: '',
  sources: '',
};

function toForm(p: Place): Form {
  const text = (v: string | null) => v ?? '';
  return {
    name: p.name,
    category: p.category,
    latitude: String(p.latitude),
    longitude: String(p.longitude),
    activation_radius: String(p.activation_radius),
    summary: text(p.summary),
    observation_prompt: text(p.observation_prompt),
    history: text(p.history),
    architecture: text(p.architecture),
    did_you_know: text(p.did_you_know),
    image_credit: text(p.image_credit),
    audio_title: text(p.audio_title),
    audio_credit: text(p.audio_credit),
    sources: text(p.sources),
  };
}

// Crear o editar una parada. Parámetros: id (si existe) y route (la ruta a
// la que se agrega una parada nueva).
export default function AdminPlaceScreen() {
  const { id, route } = useLocalSearchParams<{ id?: string; route?: string }>();
  const auth = useAuth();
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const [original, setOriginal] = useState<Place | null>(null);
  const [form, setForm] = useState<Form>(EMPTY);
  const [published, setPublished] = useState(true);
  const [media, setMedia] = useState<{ image: string | null; audio: string | null }>({ image: null, audio: null });
  const [status, setStatus] = useState<'loading' | 'ready' | 'saving' | 'error'>(id ? 'loading' : 'ready');
  const [locating, setLocating] = useState(false);

  // Archivos subidos en esta edición que todavía no se guardaron: si se sale
  // sin guardar, se borran del servidor para no dejar basura.
  const pendingUploads = useRef<string[]>([]);
  useEffect(
    () => () => {
      removeMedia(pendingUploads.current).catch(() => {});
    },
    []
  );

  useEffect(() => {
    if (!id) return;
    loadPlace(id)
      .then((place) => {
        if (!place) return setStatus('error');
        setOriginal(place);
        setForm(toForm(place));
        setPublished(place.published);
        setMedia({ image: place.image_path, audio: place.audio_path });
        setStatus('ready');
      })
      .catch(() => setStatus('error'));
  }, [id]);

  if (auth.status !== 'signedIn' || !auth.isAdmin)
    return <StateMessage message="Esta sección es solo para administración." showHomeButton />;
  if (status === 'loading') return <StateMessage loading />;
  if (status === 'error') return <StateMessage message="No se pudo cargar la parada." showHomeButton />;

  const set = (key: keyof Form) => (value: string) => setForm((f) => ({ ...f, [key]: value }));
  const slug = original?.slug ?? slugify(form.name);

  // Coordenadas del celular: para corregir la parada estando en el lugar.
  const useCurrentLocation = async () => {
    setLocating(true);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Ubicación', 'La app necesita permiso de ubicación para tomar las coordenadas.');
        return;
      }
      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Highest });
      const { latitude, longitude, accuracy } = position.coords;
      setForm((f) => ({ ...f, latitude: latitude.toFixed(7), longitude: longitude.toFixed(7) }));
      if (accuracy && accuracy > 20)
        Alert.alert('Ubicación imprecisa', `El GPS tiene un margen de ${Math.round(accuracy)} m. Si puedes, espera unos segundos al aire libre y vuelve a tomarla.`);
    } catch {
      Alert.alert('Ubicación', 'No se pudo obtener la ubicación. Revisa que el GPS esté encendido.');
    } finally {
      setLocating(false);
    }
  };

  const upload = async (kind: MediaKind) => {
    if (!slug) return Alert.alert('Falta el nombre', 'Escribe el nombre de la parada antes de subir archivos.');
    try {
      const path = await pickAndUpload(kind, slug);
      if (!path) return;
      pendingUploads.current.push(path);
      setMedia((m) => ({ ...m, [kind]: path }));
    } catch (e) {
      Alert.alert('No se pudo subir', (e as Error).message);
    }
  };

  const save = async () => {
    const latitude = Number(form.latitude.replace(',', '.'));
    const longitude = Number(form.longitude.replace(',', '.'));
    const radius = Number(form.activation_radius);
    if (!form.name.trim() || !form.category.trim())
      return Alert.alert('Faltan datos', 'La parada necesita nombre y categoría.');
    if (!Number.isFinite(latitude) || Math.abs(latitude) > 90 || !Number.isFinite(longitude) || Math.abs(longitude) > 180)
      return Alert.alert('Coordenadas inválidas', 'Revisa la latitud y la longitud (por ejemplo 4.6951 y -74.0309).');
    if (!Number.isFinite(radius) || radius < 5) return Alert.alert('Radio inválido', 'El radio debe ser de al menos 5 m.');

    const text = (v: string) => v.trim() || null;
    const draft: PlaceDraft = {
      slug,
      name: form.name.trim(),
      category: form.category.trim(),
      latitude,
      longitude,
      activation_radius: Math.round(radius),
      summary: text(form.summary),
      observation_prompt: text(form.observation_prompt),
      history: text(form.history),
      architecture: text(form.architecture),
      did_you_know: text(form.did_you_know),
      image_path: media.image,
      image_credit: text(form.image_credit),
      audio_path: media.audio,
      audio_title: text(form.audio_title),
      audio_credit: text(form.audio_credit),
      sources: text(form.sources),
      published,
    };

    setStatus('saving');
    try {
      await savePlace(original?.id ?? null, draft, original ? null : (route ?? null));
      // Guardado: los archivos nuevos ya están en uso y los reemplazados sobran.
      pendingUploads.current = [];
      const replaced = [original?.image_path, original?.audio_path].filter(
        (p) => p && p !== media.image && p !== media.audio
      );
      removeMedia(replaced as string[]).catch(() => {});
      router.back();
    } catch (e) {
      setStatus('ready');
      Alert.alert('No se pudo guardar', (e as Error).message);
    }
  };

  const confirmDelete = () => {
    if (!original) return;
    Alert.alert('Borrar parada', `Se borra «${original.name}» de todas las rutas, con su foto y su audio. No se puede deshacer.`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Borrar',
        style: 'destructive',
        onPress: async () => {
          try {
            await deletePlace(original);
            router.back();
          } catch (e) {
            Alert.alert('No se pudo borrar', (e as Error).message);
          }
        },
      },
    ]);
  };

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <BackButton />
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + space.xl + space.l, paddingBottom: insets.bottom + space.xl },
        ]}
      >
        <Txt variant="title" color={colors.primary}>
          {original ? 'Editar parada' : 'Nueva parada'}
        </Txt>

        <View style={styles.card}>
          <Txt variant="overline">DATOS</Txt>
          <Field label="Nombre" value={form.name} onChangeText={set('name')} />
          <Field label="Categoría" value={form.category} onChangeText={set('category')} hint="Por ejemplo: Patrimonio, Mercado, Galería." />
          <Pressable
            accessibilityRole="switch"
            accessibilityState={{ checked: published }}
            onPress={() => setPublished((v) => !v)}
            style={[styles.publish, published && styles.publishOn]}
          >
            <Txt variant="label" color={published ? colors.onAccent : colors.text}>
              {published ? 'Publicada: se ve en la app' : 'Oculta: no se ve en la app'}
            </Txt>
          </Pressable>
        </View>

        <View style={styles.card}>
          <Txt variant="overline">UBICACIÓN</Txt>
          <View style={styles.row}>
            <View style={styles.grow}>
              <Field label="Latitud" value={form.latitude} onChangeText={set('latitude')} keyboardType="numbers-and-punctuation" />
            </View>
            <View style={styles.grow}>
              <Field label="Longitud" value={form.longitude} onChangeText={set('longitude')} keyboardType="numbers-and-punctuation" />
            </View>
          </View>
          <Button
            label={locating ? 'Buscando…' : 'Usar mi ubicación actual'}
            variant="secondary"
            icon="locate"
            onPress={locating ? () => {} : useCurrentLocation}
          />
          <Field
            label="Radio de activación (m)"
            value={form.activation_radius}
            onChangeText={set('activation_radius')}
            keyboardType="number-pad"
            hint="Qué tan cerca hay que estar para descubrirla. Entre 25 y 40 m funciona bien."
          />
        </View>

        <View style={styles.card}>
          <Txt variant="overline">TEXTOS</Txt>
          <Field label="Resumen" value={form.summary} onChangeText={set('summary')} multiline />
          <Field label="Consigna de observación" value={form.observation_prompt} onChangeText={set('observation_prompt')} multiline />
          <Field label="Historia" value={form.history} onChangeText={set('history')} multiline />
          <Field label="Arquitectura" value={form.architecture} onChangeText={set('architecture')} multiline />
          <Field label="¿Sabías que…?" value={form.did_you_know} onChangeText={set('did_you_know')} multiline />
          <Field label="Fuentes" value={form.sources} onChangeText={set('sources')} multiline hint="De dónde sale la información." />
        </View>

        <View style={styles.card}>
          <Txt variant="overline">FOTO</Txt>
          <MediaImage uri={media.image ? mediaUrl(media.image) : null} style={styles.preview} label="Foto de la parada" />
          <View style={styles.row}>
            <View style={styles.grow}>
              <Button label={media.image ? 'Cambiar foto' : 'Subir foto'} variant="secondary" icon="image-outline" onPress={() => upload('image')} />
            </View>
            {media.image ? (
              <Button label="Quitar" variant="secondary" onPress={() => setMedia((m) => ({ ...m, image: null }))} />
            ) : null}
          </View>
          <Field label="Crédito de la foto" value={form.image_credit} onChangeText={set('image_credit')} />
        </View>

        <View style={styles.card}>
          <Txt variant="overline">AUDIO</Txt>
          <Txt variant="caption">{media.audio ? media.audio.split('/').pop() : 'Sin audio.'}</Txt>
          <View style={styles.row}>
            <View style={styles.grow}>
              <Button label={media.audio ? 'Cambiar audio' : 'Subir audio'} variant="secondary" icon="musical-notes-outline" onPress={() => upload('audio')} />
            </View>
            {media.audio ? (
              <Button label="Quitar" variant="secondary" onPress={() => setMedia((m) => ({ ...m, audio: null }))} />
            ) : null}
          </View>
          <Field label="Título del audio" value={form.audio_title} onChangeText={set('audio_title')} />
          <Field label="Crédito del audio" value={form.audio_credit} onChangeText={set('audio_credit')} />
        </View>

        <Button label={status === 'saving' ? 'Guardando…' : 'Guardar'} icon="save-outline" onPress={status === 'saving' ? () => {} : save} />
        {original ? (
          <Pressable onPress={confirmDelete} style={styles.delete} accessibilityRole="button">
            <Txt variant="label" color={colors.textMuted}>
              Borrar parada
            </Txt>
          </Pressable>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const useStyles = makeStyles((colors) => ({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: space.m + 6, gap: space.m },
  card: {
    gap: space.m - 2,
    padding: space.m + 2,
    backgroundColor: colors.surface,
    borderWidth: line,
    borderColor: colors.border,
    borderRadius: radius.m,
  },
  row: { flexDirection: 'row', gap: space.m - 4, alignItems: 'flex-end' },
  grow: { flex: 1 },
  publish: { padding: space.m - 4, borderWidth: line, borderColor: colors.border, alignItems: 'center', borderRadius: radius.s },
  publishOn: { backgroundColor: colors.accent },
  preview: { height: 180, borderWidth: line, borderColor: colors.border, borderRadius: radius.s },
  delete: { alignItems: 'center', paddingVertical: space.m },
}));
