import { Directory, File, Paths } from 'expo-file-system';

import { downloads } from './downloads';
import { mediaUrl, RemoteRoute } from './remote';

// Descarga de rutas al celular para usarlas sin conexión.
//
// Estructura en el almacenamiento de la app (el sistema no lo borra):
//   routes/{slug}/route.json      datos de la ruta tal como vinieron del servidor
//   routes/{slug}/media/{archivo} imágenes, audios y mapa
//
// Se descarga primero a routes/{slug}.tmp y solo si TODO salió bien se
// reemplaza la versión anterior: una descarga cortada no deja la ruta rota.

export const isDownloadSupported = true;

const routesDir = () => new Directory(Paths.document, 'routes');
const routeDir = (slug: string) => new Directory(Paths.document, 'routes', slug);

// Nombre de archivo local para una ruta del servidor ("images/places/a.jpg"
// -> "images__places__a.jpg").
function localName(path: string): string {
  return path.replace(/[\\/]/g, '__');
}

// Todos los archivos que necesita la ruta, sin repetidos.
function mediaPaths(route: RemoteRoute): string[] {
  const paths = [
    route.cover_image_path,
    route.map_image_path,
    ...route.places.flatMap((p) => [p.image_path, p.audio_path]),
  ];
  return [...new Set(paths.filter((p): p is string => !!p))];
}

export async function downloadRoute(
  route: RemoteRoute,
  onProgress: (done: number, total: number) => void
): Promise<void> {
  const paths = mediaPaths(route);
  const total = paths.length + 1; // + route.json

  routesDir().create({ intermediates: true, idempotent: true });
  const tmp = new Directory(Paths.document, 'routes', `${route.slug}.tmp`);
  if (tmp.exists) tmp.delete();
  const tmpMedia = new Directory(tmp, 'media');
  tmpMedia.create({ intermediates: true });

  try {
    let done = 0;
    onProgress(done, total);
    for (const path of paths) {
      await File.downloadFileAsync(mediaUrl(path), new File(tmpMedia, localName(path)), { idempotent: true });
      onProgress(++done, total);
    }
    new File(tmp, 'route.json').write(JSON.stringify(route));
    onProgress(++done, total);

    const target = routeDir(route.slug);
    if (target.exists) target.delete();
    tmp.rename(route.slug);

    downloads.record(route.slug, { version: route.version, downloadedAt: Date.now(), files: paths.length });
  } catch (error) {
    if (tmp.exists) tmp.delete();
    throw error;
  }
}

// Ruta descargada (datos + dirección local de cada archivo), o null.
export function readDownloadedRoute(
  slug: string
): { route: RemoteRoute; localUri: (path: string | null) => string | null } | null {
  if (!downloads.get(slug)) return null;
  const json = new File(routeDir(slug), 'route.json');
  if (!json.exists) {
    // El registro dice que está, pero los archivos no: se corrige el registro.
    downloads.forget(slug);
    return null;
  }
  let route: RemoteRoute;
  try {
    route = JSON.parse(json.textSync()) as RemoteRoute;
  } catch {
    // Archivo dañado: se trata como no descargada en vez de romper la app.
    downloads.forget(slug);
    return null;
  }
  const media = new Directory(routeDir(slug), 'media');
  const localUri = (path: string | null) => {
    if (!path) return null;
    const file = new File(media, localName(path));
    return file.exists ? file.uri : null;
  };
  return { route, localUri };
}

export function deleteDownloadedRoute(slug: string) {
  const dir = routeDir(slug);
  if (dir.exists) dir.delete();
  downloads.forget(slug);
}
