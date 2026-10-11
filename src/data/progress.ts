import { useSyncExternalStore } from 'react';

import { storage } from './storage';

// Progreso del visitante: qué paradas descubrió y cuáles falta anunciar
// con la tarjeta de "¡Descubriste!". Lo descubierto se guarda en el
// celular; los anuncios pendientes no (si se cierra la app, no se vuelven
// a mostrar).
//
// Se guarda por id de parada (no por ruta): una parada descubierta queda
// descubierta en cualquier ruta que la incluya.

const STORAGE_KEY = 'progress.v1';

type ProgressState = {
  discovered: Record<string, number>; // id de parada -> fecha (ms)
  announcements: string[]; // ids pendientes de mostrar, en orden
};

function load(): Record<string, number> {
  try {
    const raw = storage.get(STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, number>) : {};
  } catch {
    // Datos dañados o almacenamiento no disponible: se empieza de cero
    // en vez de impedir que la app abra.
    return {};
  }
}

function save(discovered: Record<string, number>) {
  try {
    storage.set(STORAGE_KEY, JSON.stringify(discovered));
  } catch {
    // Si no se puede guardar, el progreso sigue en memoria hasta cerrar la app.
  }
}

let state: ProgressState = { discovered: load(), announcements: [] };
const listeners = new Set<() => void>();

function setState(next: ProgressState) {
  if (next.discovered !== state.discovered) save(next.discovered);
  state = next;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// Para la sincronización con la cuenta (progressSync.ts).
export const subscribeProgress = subscribe;

export const progress = {
  isDiscovered(placeId: string): boolean {
    return placeId in state.discovered;
  },

  discovered(): Record<string, number> {
    return state.discovered;
  },

  // Suma paradas descubiertas en otro lado (la cuenta), sin anunciarlas.
  // Si una parada está en los dos, se queda la fecha más antigua.
  merge(remote: Record<string, number>) {
    const discovered = { ...state.discovered };
    let changed = false;
    for (const [id, at] of Object.entries(remote)) {
      if (!(id in discovered) || at < discovered[id]) {
        discovered[id] = at;
        changed = true;
      }
    }
    if (changed) setState({ ...state, discovered });
  },

  // Marca paradas como descubiertas. Devuelve solo las que son nuevas.
  // `announce`: si se muestra la tarjeta de descubrimiento.
  discover(placeIds: string[], { announce }: { announce: boolean }): string[] {
    const fresh = placeIds.filter((id) => !(id in state.discovered));
    if (fresh.length === 0) return [];
    const now = Date.now();
    const discovered = { ...state.discovered };
    fresh.forEach((id) => (discovered[id] = now));
    setState({
      discovered,
      announcements: announce ? [...state.announcements, ...fresh] : state.announcements,
    });
    return fresh;
  },

  // Cierra la tarjeta que se está mostrando.
  dismissAnnouncement() {
    setState({ ...state, announcements: state.announcements.slice(1) });
  },

  // Olvida las paradas indicadas (reiniciar un recorrido, repetir la demo).
  reset(placeIds: string[]) {
    const discovered = { ...state.discovered };
    placeIds.forEach((id) => delete discovered[id]);
    setState({
      discovered,
      announcements: state.announcements.filter((id) => !placeIds.includes(id)),
    });
  },
};

export function useProgress(): ProgressState {
  return useSyncExternalStore(subscribe, () => state);
}

// Cuántas paradas de una lista están descubiertas.
export function countDiscovered(placeIds: string[], discovered: Record<string, number>): number {
  return placeIds.filter((id) => id in discovered).length;
}
