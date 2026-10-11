import { Platform } from 'react-native';
import * as Application from 'expo-application';
import { Directory, Paths } from 'expo-file-system';

import { downloads } from './downloads';
import { storage } from './storage';

// Limpieza de archivos que ya no sirven. Se ejecuta al abrir la app.
//
// Siempre:
// - Descargas a medias (routes/{slug}.tmp) que quedaron si la app se cerró
//   descargando.
// - Carpetas de rutas que el registro ya no conoce (borradas o dañadas).
// Cuando se instala una versión nueva de la app:
// - La caché (audios y fotos que el sistema guardó al verlos en línea).
// Cuando el servidor ya no publica una ruta descargada: pruneDownloads().
//
// La versión anterior de una ruta descargada no se acumula: al actualizarla
// se reemplaza completa (download.native.ts).

const INSTALL_KEY = 'app.install.v1';

function routesDir() {
  return new Directory(Paths.document, 'routes');
}

function removeLeftovers() {
  const dir = routesDir();
  if (!dir.exists) return;
  const known = new Set(downloads.slugs());
  for (const entry of dir.list()) {
    if (!(entry instanceof Directory)) continue;
    if (entry.name.endsWith('.tmp') || !known.has(entry.name)) entry.delete();
  }
}

// Identificador de la instalación actual: cambia con cada APK nuevo.
async function installId(): Promise<string> {
  const version = `${Application.nativeApplicationVersion}-${Application.nativeBuildVersion}`;
  if (Platform.OS !== 'android') return version;
  try {
    return `${version}-${(await Application.getLastUpdateTimeAsync()).getTime()}`;
  } catch {
    return version;
  }
}

async function clearCacheAfterUpdate() {
  const id = await installId();
  const previous = storage.get(INSTALL_KEY);
  if (previous === id) return;
  // La primera vez (previous null) también se limpia: puede venir de una
  // versión anterior que no guardaba este dato.
  for (const entry of Paths.cache.list()) {
    try {
      entry.delete();
    } catch {
      // Un archivo en uso se queda; se intentará en la próxima actualización.
    }
  }
  storage.set(INSTALL_KEY, id);
}

export async function runStartupCleanup() {
  try {
    removeLeftovers();
    await clearCacheAfterUpdate();
  } catch {
    // La limpieza nunca debe impedir que la app abra.
  }
}

// Borra las rutas descargadas que el servidor ya no publica.
export function pruneDownloads(publishedSlugs: string[]) {
  const keep = new Set(publishedSlugs);
  for (const slug of downloads.slugs()) {
    if (keep.has(slug)) continue;
    const dir = new Directory(routesDir(), slug);
    if (dir.exists) dir.delete();
    downloads.forget(slug);
  }
}

// Espacio que ocupan las rutas descargadas, en bytes (para Ajustes).
export function downloadsSize(): number {
  const dir = routesDir();
  return dir.exists ? (dir.size ?? 0) : 0;
}

// Borra todas las rutas descargadas (Ajustes > Liberar espacio).
export function deleteAllDownloads() {
  const dir = routesDir();
  if (dir.exists) dir.delete();
  downloads.slugs().forEach((slug) => downloads.forget(slug));
}
