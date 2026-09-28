import { Place, Route } from '@/types';

// Servidor de contenido. Se define con la variable de entorno
// EXPO_PUBLIC_CONTENT_BASE_URL (archivo .env.local, que no se sube a git).
// Si no está definida, la app usa los datos de prueba que vienen dentro de
// ella (sin fotos ni audios, y sin descarga offline).
//
// Formato esperado (lo genera scripts/generar_contenido_prueba.py):
//   {CONTENT_BASE_URL}/routes.json            -> Route[]
//   {CONTENT_BASE_URL}/routes/{slug}.json     -> RemoteRoute
//   {CONTENT_BASE_URL}/media/{path}           -> archivos (image_path, audio_path...)
//
// En la fase 9 este archivo se reemplaza por lecturas a Supabase con la
// misma forma de datos.
export const CONTENT_BASE_URL: string | null = process.env.EXPO_PUBLIC_CONTENT_BASE_URL?.replace(/\/$/, '') || null;

// Ruta tal como la entrega el servidor: filas de las tablas, sin resolver.
export type RemoteRoute = Route & { places: Place[] };

export function isRemoteConfigured(): boolean {
  return CONTENT_BASE_URL !== null;
}

export function mediaUrl(path: string): string {
  return `${CONTENT_BASE_URL}/media/${path}`;
}

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(`${CONTENT_BASE_URL}/${path}`);
  if (!response.ok) throw new Error(`HTTP ${response.status} al pedir ${path}`);
  return (await response.json()) as T;
}

export function fetchRoutes(): Promise<Route[]> {
  return getJson<Route[]>('routes.json');
}

export function fetchRoute(slug: string): Promise<RemoteRoute> {
  return getJson<RemoteRoute>(`routes/${encodeURIComponent(slug)}.json`);
}
