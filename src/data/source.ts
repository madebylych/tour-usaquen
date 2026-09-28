// Única puerta de entrada a los datos. Las pantallas no saben de dónde vienen:
// hoy de los datos de prueba locales; más adelante de los archivos descargados
// (fase 7) y de Supabase (fase 9). Las funciones son async desde ya para que
// ese cambio no obligue a tocar las pantallas.

import { Place, Route, RouteWithPlaces } from '@/types';
import { places, routePlaces, routes } from './local/testData';

export async function listRoutes(): Promise<Route[]> {
  return routes.filter((r) => r.published);
}

export async function getRoute(slug: string): Promise<RouteWithPlaces | null> {
  const route = routes.find((r) => r.slug === slug && r.published);
  if (!route) return null;

  const ordered = routePlaces
    .filter((rp) => rp.route_id === route.id)
    .sort((a, b) => a.position - b.position)
    .map((rp) => places.find((p) => p.id === rp.place_id && p.published))
    .filter((p): p is Place => p !== undefined);

  return { ...route, places: ordered };
}

export async function getPlace(id: string): Promise<Place | null> {
  return places.find((p) => p.id === id && p.published) ?? null;
}
