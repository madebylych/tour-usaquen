import { useSyncExternalStore } from 'react';

import { storage } from './storage';

// Registro de las rutas descargadas en el celular: qué versión se bajó y
// cuándo. Los archivos en sí los maneja download.native.ts.

const STORAGE_KEY = 'downloads.v1';

export type DownloadRecord = {
  version: number;
  downloadedAt: number; // ms
  files: number;
};

type DownloadsState = Record<string, DownloadRecord>; // slug -> registro

function load(): DownloadsState {
  try {
    const raw = storage.get(STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === 'object' ? (parsed as DownloadsState) : {};
  } catch {
    return {};
  }
}

let state: DownloadsState = load();
const listeners = new Set<() => void>();

function setState(next: DownloadsState) {
  state = next;
  try {
    storage.set(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Si no se puede guardar, el registro vive en memoria hasta cerrar la app.
  }
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export const downloads = {
  slugs(): string[] {
    return Object.keys(state);
  },
  get(slug: string): DownloadRecord | undefined {
    return state[slug];
  },
  record(slug: string, record: DownloadRecord) {
    setState({ ...state, [slug]: record });
  },
  forget(slug: string) {
    const next = { ...state };
    delete next[slug];
    setState(next);
  },
};

export function useDownloads(): DownloadsState {
  return useSyncExternalStore(subscribe, () => state);
}
