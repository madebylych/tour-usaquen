import Storage from 'expo-sqlite/kv-store';

// Almacenamiento clave/valor persistente en el celular (SQLite).
// Síncrono a propósito: los datos son pequeños y así el progreso está
// disponible desde el primer render, sin pantalla de carga.
export const storage = {
  get(key: string): string | null {
    return Storage.getItemSync(key);
  },
  set(key: string, value: string): void {
    Storage.setItemSync(key, value);
  },
  remove(key: string): void {
    Storage.removeItemSync(key);
  },
};
