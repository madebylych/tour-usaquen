import { RemoteRoute } from './remote';

// Versión web (vista previa): no hay descarga offline. La app usa
// download.native.ts.

export const isDownloadSupported = false;

export async function downloadRoute(
  _route: RemoteRoute,
  _onProgress: (done: number, total: number) => void
): Promise<void> {
  throw new Error('La descarga offline solo está disponible en la app.');
}

export function readDownloadedRoute(
  _slug: string
): { route: RemoteRoute; localUri: (path: string | null) => string | null } | null {
  return null;
}

export function deleteDownloadedRoute(_slug: string) {}
