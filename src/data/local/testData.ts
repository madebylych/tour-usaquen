// Datos DE PRUEBA para las fases 1-8. No son lugares reales: los nombres,
// textos y coordenadas son provisionales (coordenadas aproximadas alrededor
// del parque de Usaquén). Se reemplazan por el contenido del grupo en Supabase
// (fase 9). Cada arreglo tiene la forma de su tabla.

import { Place, Route, RoutePlace } from '@/types';

const UPDATED_AT = '2026-09-27T00:00:00Z';

export const routes: Route[] = [
  {
    id: 'test-route-1',
    slug: 'usaquen-centro',
    name: 'Ruta de prueba: Usaquén centro',
    description: 'Recorrido de prueba con tres paradas para desarrollar la app.',
    duration_min: 45,
    distance_m: 800,
    cover_image_path: null,
    map_image_path: null,
    map_bounds: null,
    version: 1,
    published: true,
    updated_at: UPDATED_AT,
  },
];

const testPlace = (
  n: number,
  category: string,
  latitude: number,
  longitude: number
): Place => ({
  id: `test-place-${n}`,
  slug: `parada-prueba-${n}`,
  name: `Parada de prueba ${n}`,
  category,
  latitude,
  longitude,
  activation_radius: 30,
  summary: `Resumen de prueba de la parada ${n}.`,
  history: 'Texto de prueba. Aquí va la historia del lugar, escrita por el grupo con sus fuentes.',
  architecture: 'Texto de prueba. Aquí va la lectura arquitectónica del lugar.',
  did_you_know: 'Dato curioso de prueba.',
  observation_prompt: 'Consigna de prueba: mira hacia arriba y observa la fachada frente a ti.',
  image_path: null,
  image_credit: null,
  audio_path: null,
  audio_title: null,
  audio_credit: null,
  sources: null,
  published: true,
  updated_at: UPDATED_AT,
});

export const places: Place[] = [
  testPlace(1, 'Galería', 4.6952, -74.0312),
  testPlace(2, 'Música', 4.6945, -74.03),
  testPlace(3, 'Arquitectura', 4.6938, -74.0315),
];

export const routePlaces: RoutePlace[] = [
  { route_id: 'test-route-1', place_id: 'test-place-1', position: 1 },
  { route_id: 'test-route-1', place_id: 'test-place-2', position: 2 },
  { route_id: 'test-route-1', place_id: 'test-place-3', position: 3 },
];
