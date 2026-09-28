import { File } from 'expo-file-system';

const MIME: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
};

// Dirección de una imagen que la página del mapa pueda cargar.
// La página vive en un WebView sin acceso a los archivos del celular, así
// que una imagen descargada (file://) se le pasa como data URL (base64).
// Las URL remotas (https://) se pasan tal cual.
export async function imageUrlForMap(uri: string): Promise<string> {
  if (!uri.startsWith('file://')) return uri;
  const file = new File(uri);
  const ext = file.extension.replace('.', '').toLowerCase();
  return `data:${MIME[ext] ?? 'image/jpeg'};base64,${await file.base64()}`;
}
