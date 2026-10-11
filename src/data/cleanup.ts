// En la web no hay archivos descargados ni caché propia: nada que limpiar.
export async function runStartupCleanup() {}

export function pruneDownloads(_publishedSlugs: string[]) {}

export function downloadsSize(): number {
  return 0;
}

export function deleteAllDownloads() {}
