// Mensajes entre la app y la página del mapa (mapHtml.ts).
// La página no sabe nada de React: recibe el estado completo y lo dibuja.

export type MapPlace = {
  id: string;
  n: number; // número de la parada en la ruta
  lat: number;
  lng: number;
};

export type MapUser = {
  lat: number;
  lng: number;
  accuracy: number | null; // metros; null si es simulada
  simulated: boolean;
};

// Mapa ilustrado: imagen anclada por sus esquinas.
// bounds: [[lat_norte, lon_oeste], [lat_sur, lon_este]].
export type MapImage = {
  url: string;
  bounds: [[number, number], [number, number]];
};

// De la app al mapa.
export type ToMap =
  | {
      type: 'state';
      places: MapPlace[];
      selectedId: string | null;
      discovered: string[];
      user: MapUser | null;
      mapImage: MapImage | null;
    }
  | { type: 'center'; lat: number; lng: number };

// Del mapa a la app.
export type FromMap =
  | { type: 'ready'; online: boolean } // online: si cargó el mapa base de OpenFreeMap
  | { type: 'select'; id: string }
  | { type: 'press'; lat: number; lng: number }
  | { type: 'error'; message: string };

export function parseFromMap(data: unknown): FromMap | null {
  try {
    const msg = typeof data === 'string' ? JSON.parse(data) : data;
    if (msg && typeof msg === 'object' && typeof (msg as { type?: unknown }).type === 'string') {
      return msg as FromMap;
    }
  } catch {
    // Mensaje que no es nuestro: se ignora.
  }
  return null;
}
