import { useSyncExternalStore } from 'react';

import { Coordinates, distanceInMeters } from '@/geo/distance';
import { storage } from './storage';

// Mapa para raspar: qué hexágonos destapó la persona y cuánto ha caminado.
// Solo avanza con el tour abierto (no hay rastreo en segundo plano) y se
// guarda únicamente en el celular.

const STORAGE_KEY = 'scratch.v1';
const MIN_STEP_M = 10; // por debajo es ruido del GPS
const MAX_STEP_M = 150; // por encima es un salto del GPS o de la simulación

type ScratchState = {
  revealed: Record<string, true>;
  walkedM: number;
  newZones: number; // destapados desde que se abrió el tour (no se guarda)
};

function load(): ScratchState {
  try {
    const raw = storage.get(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as { cells?: string[]; walkedM?: number }) : {};
    const revealed: Record<string, true> = {};
    (parsed.cells ?? []).forEach((key) => (revealed[key] = true));
    return { revealed, walkedM: typeof parsed.walkedM === 'number' ? parsed.walkedM : 0, newZones: 0 };
  } catch {
    return { revealed: {}, walkedM: 0, newZones: 0 };
  }
}

let state = load();
let lastPoint: Coordinates | null = null;
const listeners = new Set<() => void>();

function setState(next: ScratchState) {
  state = next;
  try {
    storage.set(STORAGE_KEY, JSON.stringify({ cells: Object.keys(next.revealed), walkedM: next.walkedM }));
  } catch {
    // Si no se puede guardar, sigue en memoria hasta cerrar la app.
  }
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export const scratch = {
  // Al abrir el tour: lo caminado se mide desde aquí, no desde la última visita.
  beginSession() {
    lastPoint = null;
    if (state.newZones !== 0) setState({ ...state, newZones: 0 });
  },

  // Registra una posición: destapa los hexágonos y suma lo caminado.
  record(position: Coordinates, keys: string[]) {
    const fresh = keys.filter((key) => !(key in state.revealed));
    let walked = 0;
    if (lastPoint === null) lastPoint = position;
    else {
      const step = distanceInMeters(lastPoint, position);
      if (step >= MIN_STEP_M) {
        if (step <= MAX_STEP_M) walked = step;
        lastPoint = position;
      }
    }
    if (fresh.length === 0 && walked === 0) return;
    const revealed = fresh.length > 0 ? { ...state.revealed } : state.revealed;
    fresh.forEach((key) => (revealed[key] = true));
    setState({ revealed, walkedM: state.walkedM + walked, newZones: state.newZones + fresh.length });
  },

  reset() {
    lastPoint = null;
    setState({ revealed: {}, walkedM: 0, newZones: 0 });
  },
};

export function useScratchState(): ScratchState {
  return useSyncExternalStore(subscribe, () => state);
}
