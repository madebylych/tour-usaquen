import { Place, Route } from '@/types';

// Servidor de contenido: Supabase (base de datos + archivos).
//
// Se configura con variables de entorno (.env.local en desarrollo, eas.json
// para los APK):
//   EXPO_PUBLIC_SUPABASE_URL              https://xxxx.supabase.co
//   EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY  sb_publishable_...
// La clave publicable está hecha para ir dentro de la app: solo permite leer
// lo publicado (reglas en supabase/schema.sql).
//
// Si no están definidas, la app usa los datos de prueba que vienen dentro de
// ella (sin fotos ni audios, y sin descarga offline).
//
// Se usa la API REST directamente (fetch), sin la librería supabase-js:
// para leer datos públicos no hace falta más.

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL?.replace(/\/$/, '') || null;
const PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY || null;
const MEDIA_BUCKET = 'media';

// Ruta tal como la entrega el servidor: filas de las tablas, sin resolver.
export type RemoteRoute = Route & { places: Place[] };

export function isRemoteConfigured(): boolean {
  return SUPABASE_URL !== null && PUBLISHABLE_KEY !== null;
}

export function mediaUrl(path: string): string {
  const encoded = path.split('/').map(encodeURIComponent).join('/');
  return `${SUPABASE_URL}/storage/v1/object/public/${MEDIA_BUCKET}/${encoded}`;
}

async function rest<T>(query: string): Promise<T> {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${query}`, {
    headers: { apikey: PUBLISHABLE_KEY ?? '', Accept: 'application/json' },
  });
  if (!response.ok) throw new Error(`Supabase respondió ${response.status}`);
  return (await response.json()) as T;
}

export function fetchRoutes(): Promise<Route[]> {
  return rest<Route[]>('routes?select=*&published=eq.true&order=name');
}

type RouteRow = Route & {
  route_places: { position: number; places: Place | null }[];
};

// Una ruta con sus paradas en orden. Las paradas no publicadas llegan como
// null (las reglas de acceso no las dejan ver) y se descartan.
export async function fetchRoute(slug: string): Promise<RemoteRoute> {
  const rows = await rest<RouteRow[]>(
    `routes?select=*,route_places(position,places(*))&slug=eq.${encodeURIComponent(slug)}&published=eq.true`
  );
  const row = rows[0];
  if (!row) throw new Error('Este recorrido no existe o no está publicado.');
  const { route_places, ...route } = row;
  const places = [...route_places]
    .sort((a, b) => a.position - b.position)
    .map((rp) => rp.places)
    .filter((p): p is Place => p !== null);
  return { ...route, places };
}
