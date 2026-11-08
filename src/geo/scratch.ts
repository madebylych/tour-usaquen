import { Coordinates } from './distance';

// Geometría del mapa para raspar: hexágonos que cubren el mundo entero,
// identificados por sus coordenadas "q,r". No depende de React ni guarda nada
// (eso es data/scratch.ts); la página del mapa dibuja con la misma fórmula.
//
// La escala sale de la latitud redondeada de la ruta, no de la posición de las
// paradas: si una parada se mueve en el admin, lo destapado sigue en su sitio.

export const HEX_RADIUS_M = 22;
const METERS_PER_DEGREE = 111320;
const ZONE_WIDTH_M = 60; // lo que cuenta para el % explorado, a cada lado de la ruta
const SQRT3 = Math.sqrt(3);
const NEIGHBORS = [
  [0, 0],
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
  [1, -1],
  [-1, 1],
];

export type ScratchGrid = {
  zone: string[]; // hexágonos cercanos a la ruta: la base del % explorado
  cosLat: number;
};

export const EMPTY_GRID: ScratchGrid = { zone: [], cosLat: 1 };

type Point = { x: number; y: number };

function project(p: Coordinates, cosLat: number): Point {
  return { x: p.longitude * METERS_PER_DEGREE * cosLat, y: p.latitude * METERS_PER_DEGREE };
}

// Redondeo de coordenadas axiales al hexágono más cercano.
function roundHex(q: number, r: number): [number, number] {
  const s = -q - r;
  let rq = Math.round(q);
  let rr = Math.round(r);
  const rs = Math.round(s);
  const dq = Math.abs(rq - q);
  const dr = Math.abs(rr - r);
  const ds = Math.abs(rs - s);
  if (dq > dr && dq > ds) rq = -rr - rs;
  else if (dr > ds) rr = -rq - rs;
  return [rq, rr];
}

function distanceToSegment(p: Point, a: Point, b: Point): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const length2 = dx * dx + dy * dy;
  const t = length2 === 0 ? 0 : Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / length2));
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
}

export function buildGrid(stops: Coordinates[]): ScratchGrid {
  if (stops.length === 0) return EMPTY_GRID;
  // Redondeado para que la escala no cambie con ajustes pequeños de las paradas.
  const cosLat = Math.cos((Math.round(stops[0].latitude * 10) / 10) * (Math.PI / 180));
  const points = stops.map((s) => project(s, cosLat));
  const segments = points.length === 1 ? [[points[0], points[0]]] : points.slice(1).map((p, i) => [points[i], p]);
  const minX = Math.min(...points.map((p) => p.x)) - ZONE_WIDTH_M;
  const maxX = Math.max(...points.map((p) => p.x)) + ZONE_WIDTH_M;
  const minY = Math.min(...points.map((p) => p.y)) - ZONE_WIDTH_M;
  const maxY = Math.max(...points.map((p) => p.y)) + ZONE_WIDTH_M;

  const zone: string[] = [];
  const firstRow = Math.floor(minY / (1.5 * HEX_RADIUS_M));
  const lastRow = Math.ceil(maxY / (1.5 * HEX_RADIUS_M));
  for (let r = firstRow; r <= lastRow; r++) {
    const firstColumn = Math.floor(minX / (SQRT3 * HEX_RADIUS_M) - r / 2);
    const lastColumn = Math.ceil(maxX / (SQRT3 * HEX_RADIUS_M) - r / 2);
    for (let q = firstColumn; q <= lastColumn; q++) {
      const center = { x: HEX_RADIUS_M * SQRT3 * (q + r / 2), y: HEX_RADIUS_M * 1.5 * r };
      if (segments.some(([a, b]) => distanceToSegment(center, a, b) <= ZONE_WIDTH_M)) zone.push(`${q},${r}`);
    }
  }
  return { zone, cosLat };
}

// El hexágono donde está la persona y los seis que lo rodean.
export function keysAround(position: Coordinates, grid: ScratchGrid): string[] {
  const { x, y } = project(position, grid.cosLat);
  const [q, r] = roundHex(((SQRT3 / 3) * x - y / 3) / HEX_RADIUS_M, ((2 / 3) * y) / HEX_RADIUS_M);
  return NEIGHBORS.map(([dq, dr]) => `${q + dq},${r + dr}`);
}
