import { useSyncExternalStore } from 'react';

import { Coordinates } from './distance';

// Modo simulación: reemplaza el GPS por una posición que se mueve tocando
// el mapa. Sirve para desarrollar sin ir a Usaquén y para presentar en clase.
// Es un estado global mínimo: vive mientras la app esté abierta.

type SimulatorState = {
  enabled: boolean;
  position: Coordinates | null;
};

let state: SimulatorState = { enabled: false, position: null };
const listeners = new Set<() => void>();

function setState(next: SimulatorState) {
  state = next;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export const simulator = {
  // `start` es la posición inicial si todavía no hay una simulada.
  toggle(start: Coordinates) {
    if (state.enabled) setState({ ...state, enabled: false });
    else setState({ enabled: true, position: state.position ?? start });
  },
  moveTo(position: Coordinates) {
    if (state.enabled) setState({ ...state, position });
  },
};

export function useSimulator(): SimulatorState {
  return useSyncExternalStore(subscribe, () => state);
}
