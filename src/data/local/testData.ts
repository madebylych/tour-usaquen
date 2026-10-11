// Datos incluidos en la app: se usan cuando no hay servidor de contenido
// configurado (EXPO_PUBLIC_SUPABASE_*). Vienen de ruta_usaquen.json, la
// misma fuente que scripts/generar_contenido.py sube a Supabase. Cada arreglo
// tiene la forma de su tabla.

import { Place, Route, RoutePlace } from '@/types';
import content from './ruta_usaquen.json';

export const routes: Route[] = [content.route as Route];

export const places: Place[] = content.places as Place[];

export const routePlaces: RoutePlace[] = places.map((place, i) => ({
  route_id: content.route.id,
  place_id: place.id,
  position: i + 1,
}));
