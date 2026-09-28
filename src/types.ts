// Tipos del modelo de datos. Reflejan las tablas de Supabase
// (ver docs/PLAN_TECNICO.md, sección 3). Mantener ambos sincronizados.

export type Place = {
  id: string;
  slug: string;
  name: string;
  category: string;
  latitude: number;
  longitude: number;
  activation_radius: number; // metros
  summary: string | null;
  history: string | null;
  architecture: string | null;
  did_you_know: string | null;
  observation_prompt: string | null;
  image_path: string | null;
  image_credit: string | null;
  audio_path: string | null;
  audio_title: string | null;
  audio_credit: string | null;
  sources: string | null;
  published: boolean;
  updated_at: string;
};

// [[lat_norte, lon_oeste], [lat_sur, lon_este]]
export type MapBounds = [[number, number], [number, number]];

export type Route = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  duration_min: number | null;
  distance_m: number | null;
  cover_image_path: string | null;
  map_image_path: string | null;
  map_bounds: MapBounds | null;
  version: number;
  published: boolean;
  updated_at: string;
};

export type RoutePlace = {
  route_id: string;
  place_id: string;
  position: number;
};

// Lo que usa la app: una ruta con sus paradas ya ordenadas.
export type RouteWithPlaces = Route & {
  places: Place[];
};
