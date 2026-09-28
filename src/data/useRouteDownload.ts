import { useEffect, useState } from 'react';

import { deleteDownloadedRoute, downloadRoute, isDownloadSupported } from './download';
import { useDownloads } from './downloads';
import { isRemoteConfigured } from './remote';
import { getRemoteVersion, getRouteForDownload } from './source';

export type DownloadStatus =
  | { kind: 'unavailable' } // sin servidor de contenido o en web
  | { kind: 'idle' } // se puede descargar
  | { kind: 'downloading'; done: number; total: number }
  | { kind: 'downloaded'; outdated: boolean }
  | { kind: 'error'; message: string };

// Estado y acciones de la descarga offline de una ruta.
export function useRouteDownload(slug: string) {
  const record = useDownloads()[slug];
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [remoteVersion, setRemoteVersion] = useState<number | null>(null);

  // Si la ruta está descargada, se consulta (en silencio) si hay una
  // versión más nueva en el servidor.
  const downloadedVersion = record?.version;
  useEffect(() => {
    if (downloadedVersion === undefined) return;
    let active = true;
    getRemoteVersion(slug).then((v) => active && setRemoteVersion(v));
    return () => {
      active = false;
    };
  }, [slug, downloadedVersion]);

  const start = async () => {
    setError(null);
    setProgress({ done: 0, total: 1 });
    try {
      const route = await getRouteForDownload(slug);
      await downloadRoute(route, (done, total) => setProgress({ done, total }));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo descargar');
    } finally {
      setProgress(null);
    }
  };

  const remove = () => deleteDownloadedRoute(slug);

  let status: DownloadStatus;
  if (!isDownloadSupported || !isRemoteConfigured()) status = { kind: 'unavailable' };
  else if (progress) status = { kind: 'downloading', ...progress };
  else if (error) status = { kind: 'error', message: error };
  else if (record) status = { kind: 'downloaded', outdated: remoteVersion !== null && remoteVersion > record.version };
  else status = { kind: 'idle' };

  return { status, start, remove };
}
