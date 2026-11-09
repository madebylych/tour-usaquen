import data from '@/data/local/ruta_usaquen_calles.json';
import { Coordinates, distanceInMeters } from './distance';

// Camino real por calles entre las paradas. Viene dentro de la app, así que
// funciona sin conexión. Si las paradas cambian en el admin y dejan de coincidir
// con él (o cambian de orden), se vuelve a las líneas rectas entre paradas.

const MAX_STOP_OFFSET_M = 30;
const PATH: Coordinates[] = data.path.map(([longitude, latitude]) => ({ latitude, longitude }));

export function streetPath(stops: Coordinates[]): Coordinates[] {
  if (stops.length === 0) return stops;
  const close = (a: Coordinates, b: Coordinates) => distanceInMeters(a, b) <= MAX_STOP_OFFSET_M;
  if (!close(PATH[0], stops[0]) || !close(PATH[PATH.length - 1], stops[stops.length - 1])) return stops;

  let from = 0;
  for (const stop of stops) {
    const found = PATH.findIndex((point, i) => i >= from && close(point, stop));
    if (found < 0) return stops;
    from = found;
  }
  return PATH;
}
