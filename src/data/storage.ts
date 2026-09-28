// Versión web del almacenamiento (la app usa storage.native.ts).
// La web no es parte del MVP; esto solo evita que se rompa al revisarla
// en el navegador.
export const storage = {
  get(key: string): string | null {
    try {
      return globalThis.localStorage?.getItem(key) ?? null;
    } catch {
      return null;
    }
  },
  set(key: string, value: string): void {
    try {
      globalThis.localStorage?.setItem(key, value);
    } catch {
      // Sin almacenamiento disponible: el progreso vive solo en memoria.
    }
  },
  remove(key: string): void {
    try {
      globalThis.localStorage?.removeItem(key);
    } catch {
      // Igual que arriba.
    }
  },
};
