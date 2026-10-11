// Única puerta de entrada a los datos. Las pantallas no saben de dónde vienen.
//
// Orden de prioridad para una ruta:
//   1. Descargada en el celular (funciona sin conexión).
//   2. Servidor de contenido, si está configurado (remote.ts).
//   3. Datos de prueba incluidos en la app (sin fotos ni audios).

import { Place, PlaceWithMedia, Route, RouteWithPlaces } from '@/types';
import { pruneDownloads } from './cleanup';
import { readDownloadedRoute } from './download';
import { downloads } from './downloads';
import { places, routePlaces, routes } from './local/testData';
import { fetchRoute, fetchRoutes, isRemoteConfigured, mediaUrl, RemoteRoute } from './remote';

// Convierte la ruta "cruda" en lo que usa la app, resolviendo cada archivo
// a una dirección concreta (local o remota).
function resolve(route: RemoteRoute, uriFor: (path: string | null) => string | null): RouteWithPlaces {
  return {
    ...route,
    places: route.places
      .filter((p) => p.published)
      .map<PlaceWithMedia>((p) => ({ ...p, media: { image: uriFor(p.image_path), audio: uriFor(p.audio_path) } })),
    media: { cover: uriFor(route.cover_image_path), map: uriFor(route.map_image_path) },
  };
}

const remoteUri = (path: string | null) => (path ? mediaUrl(path) : null);

function testRoute(slug: string): RemoteRoute | null {
  const route = routes.find((r) => r.slug === slug && r.published);
  if (!route) return null;
  const ordered = routePlaces
    .filter((rp) => rp.route_id === route.id)
    .sort((a, b) => a.position - b.position)
    .map((rp) => places.find((p) => p.id === rp.place_id))
    .filter((p): p is Place => p !== undefined);
  return { ...route, places: ordered };
}

export async function listRoutes(): Promise<Route[]> {
  if (isRemoteConfigured()) {
    try {
      const published = (await fetchRoutes()).filter((r) => r.published);
      // Lo que el servidor ya no publica se borra del celular.
      pruneDownloads(published.map((r) => r.slug));
      return published;
    } catch {
      // Sin conexión: se muestran las rutas descargadas que haya.
      return downloads
        .slugs()
        .map((slug) => readDownloadedRoute(slug)?.route)
        .filter((r): r is RemoteRoute => r !== undefined);
    }
  }
  return routes.filter((r) => r.published);
}

export async function getRoute(slug: string): Promise<RouteWithPlaces | null> {
  const downloaded = readDownloadedRoute(slug);
  if (downloaded) return resolve(downloaded.route, downloaded.localUri);

  if (isRemoteConfigured()) return resolve(await fetchRoute(slug), remoteUri);

  const test = testRoute(slug);
  return test ? resolve(test, () => null) : null;
}

// Una parada dentro de su ruta (así se sabe de dónde salen sus archivos).
export async function getPlace(routeSlug: string, placeId: string): Promise<PlaceWithMedia | null> {
  const route = await getRoute(routeSlug);
  return route?.places.find((p) => p.id === placeId) ?? null;
}

// Versión de la ruta en el servidor, para saber si la descargada está
// desactualizada. null si no hay servidor o no hay conexión.
export async function getRemoteVersion(slug: string): Promise<number | null> {
  if (!isRemoteConfigured()) return null;
  try {
    return (await fetchRoute(slug)).version;
  } catch {
    return null;
  }
}

// Datos crudos para descargar (solo desde el servidor).
export async function getRouteForDownload(slug: string): Promise<RemoteRoute> {
  return fetchRoute(slug);
}
