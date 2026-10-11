import { useSyncExternalStore } from 'react';

import { storage } from './storage';

// Ajustes del visitante, guardados en el celular. El tema (claro, oscuro o
// el del dispositivo) vive en theme.ts porque lo necesita todo el árbol.

const STORAGE_KEY = 'settings.v1';

export const VOLUME_STEPS = 5; // el volumen se elige en 6 niveles: 0 a 5

export type Settings = {
  placeVolume: number; // audios de las paradas, 0 a VOLUME_STEPS
  uiVolume: number; // sonidos de la app (descubrir una parada), 0 a VOLUME_STEPS
  haptics: boolean; // vibración
};

const DEFAULTS: Settings = { placeVolume: VOLUME_STEPS, uiVolume: 4, haptics: true };

function clampStep(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value)
    ? Math.min(VOLUME_STEPS, Math.max(0, Math.round(value)))
    : fallback;
}

function load(): Settings {
  try {
    const raw = storage.get(STORAGE_KEY);
    const parsed = (raw ? JSON.parse(raw) : {}) as Partial<Settings>;
    return {
      placeVolume: clampStep(parsed.placeVolume, DEFAULTS.placeVolume),
      uiVolume: clampStep(parsed.uiVolume, DEFAULTS.uiVolume),
      haptics: typeof parsed.haptics === 'boolean' ? parsed.haptics : DEFAULTS.haptics,
    };
  } catch {
    return DEFAULTS;
  }
}

let state: Settings = load();
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export const settings = {
  get(): Settings {
    return state;
  },
  update(patch: Partial<Settings>) {
    state = { ...state, ...patch };
    try {
      storage.set(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Si no se puede guardar, el ajuste dura hasta cerrar la app.
    }
    listeners.forEach((listener) => listener());
  },
};

export function useSettings(): Settings {
  return useSyncExternalStore(subscribe, () => state);
}

// Nivel (0 a VOLUME_STEPS) a volumen del reproductor (0 a 1).
export const toVolume = (step: number) => step / VOLUME_STEPS;
