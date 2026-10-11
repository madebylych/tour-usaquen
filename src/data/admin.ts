import * as DocumentPicker from 'expo-document-picker';

import { Place, Route } from '@/types';
import { readPickedFile } from './pickedFile';
import { supabase } from './supabase';

// Operaciones del panel de administración. Usan la sesión de la persona:
// si su correo no está en `admins`, Supabase las rechaza (supabase/admin.sql).
// Cada cambio sube solo la versión de la ruta (triggers), así los celulares
// con la ruta descargada ven "Actualizar".

const BUCKET = 'media';

function client() {
  if (!supabase) throw new Error('Esta versión de la app no tiene servidor configurado.');
  return supabase;
}

function fail(error: { message: string } | null, what: string) {
  if (error) throw new Error(`${what}: ${error.message}`);
}

export type AdminRoute = Route & { places: Place[] };

// Todas las rutas (también las no publicadas) con sus paradas en orden.
export async function loadAdminRoutes(): Promise<AdminRoute[]> {
  const { data, error } = await client()
    .from('routes')
    .select('*, route_places(position, places(*))')
    .order('name');
  fail(error, 'No se pudieron cargar las rutas');
  return (data ?? []).map((row) => {
    const { route_places, ...route } = row as Route & { route_places: { position: number; places: Place }[] };
    const places = [...route_places].sort((a, b) => a.position - b.position).map((rp) => rp.places);
    return { ...route, places };
  });
}

export async function loadPlace(id: string): Promise<Place | null> {
  const { data, error } = await client().from('places').select('*').eq('id', id).maybeSingle();
  fail(error, 'No se pudo cargar la parada');
  return data as Place | null;
}

export type PlaceDraft = Omit<Place, 'id' | 'updated_at'>;

// Crea (sin id) o actualiza una parada. Una parada nueva se agrega al final
// de la ruta indicada.
export async function savePlace(id: string | null, draft: PlaceDraft, routeId: string | null): Promise<Place> {
  const db = client();
  if (id) {
    const { data, error } = await db.from('places').update(draft).eq('id', id).select().single();
    fail(error, 'No se pudo guardar');
    return data as Place;
  }
  const { data, error } = await db.from('places').insert(draft).select().single();
  fail(error, 'No se pudo crear la parada');
  const place = data as Place;
  if (routeId) {
    const { data: last } = await db
      .from('route_places')
      .select('position')
      .eq('route_id', routeId)
      .order('position', { ascending: false })
      .limit(1);
    const position = (last?.[0]?.position ?? 0) + 1;
    const { error: linkError } = await db.from('route_places').insert({ route_id: routeId, place_id: place.id, position });
    fail(linkError, 'La parada se creó pero no se pudo agregar a la ruta');
  }
  return place;
}

// Borra la parada (y su lugar en las rutas) y sus archivos del servidor.
export async function deletePlace(place: Place) {
  const { error } = await client().from('places').delete().eq('id', place.id);
  fail(error, 'No se pudo borrar');
  await removeMedia([place.image_path, place.audio_path]);
}

export async function saveRoute(id: string, patch: Partial<Route>) {
  const { error } = await client().from('routes').update(patch).eq('id', id);
  fail(error, 'No se pudo guardar la ruta');
}

// Cambia el orden de las paradas: reescribe las posiciones completas.
// Primero a posiciones temporales negativas porque (route_id, position) es
// único y un intercambio directo chocaría.
export async function reorderPlaces(routeId: string, placeIds: string[]) {
  const db = client();
  for (const [i, placeId] of placeIds.entries()) {
    const { error } = await db.from('route_places').update({ position: -(i + 1) }).eq('route_id', routeId).eq('place_id', placeId);
    fail(error, 'No se pudo reordenar');
  }
  for (const [i, placeId] of placeIds.entries()) {
    const { error } = await db.from('route_places').update({ position: i + 1 }).eq('route_id', routeId).eq('place_id', placeId);
    fail(error, 'No se pudo reordenar');
  }
}

export type MediaKind = 'image' | 'audio';

// Elige un archivo del celular y lo sube. Devuelve la ruta dentro del
// bucket, o null si se canceló. El nombre lleva la fecha para que nunca
// se confunda con una versión vieja guardada en algún celular.
export async function pickAndUpload(kind: MediaKind, slug: string): Promise<string | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: kind === 'image' ? 'image/*' : 'audio/*',
    copyToCacheDirectory: true,
  });
  if (result.canceled || !result.assets[0]) return null;
  const asset = result.assets[0];
  const ext = (asset.name.split('.').pop() ?? (kind === 'image' ? 'jpg' : 'mp3')).toLowerCase();
  const folder = kind === 'image' ? 'images/places' : 'audio/places';
  const path = `${folder}/${slug}-${Date.now()}.${ext}`;
  const body = await readPickedFile(asset);
  const { error } = await client()
    .storage.from(BUCKET)
    .upload(path, body, { contentType: asset.mimeType ?? undefined, upsert: false });
  fail(error, 'No se pudo subir el archivo');
  return path;
}

// Borra archivos que ya no usa nadie (al reemplazar o al borrar una parada).
export async function removeMedia(paths: (string | null)[]) {
  const list = paths.filter((p): p is string => !!p);
  if (list.length === 0) return;
  await client().storage.from(BUCKET).remove(list);
}

// "Plaza de Usaquén" -> "plaza-de-usaquen"
export function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
