import { useSyncExternalStore } from 'react';

// Progreso del visitante: qué paradas descubrió y cuáles falta anunciar
// con la tarjeta de "¡Descubriste!". Por ahora vive en memoria; en la
// fase 5 se guarda en el celular sin cambiar esta interfaz.
//
// Se guarda por id de parada (no por ruta): una parada descubierta queda
// descubierta en cualquier ruta que la incluya.

type ProgressState = {
  discovered: Record<string, number>; // id de parada -> fecha (ms)
  announcements: string[]; // ids pendientes de mostrar, en orden
};

let state: ProgressState = { discovered: {}, announcements: [] };
const listeners = new Set<() => void>();

function setState(next: ProgressState) {
  state = next;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export const progress = {
  isDiscovered(placeId: string): boolean {
    return placeId in state.discovered;
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
};

export function useProgress(): ProgressState {
  return useSyncExternalStore(subscribe, () => state);
}
