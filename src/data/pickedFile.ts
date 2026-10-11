import type { DocumentPickerAsset } from 'expo-document-picker';

// En la web el selector entrega un File del navegador.
export async function readPickedFile(asset: DocumentPickerAsset): Promise<ArrayBuffer> {
  if (asset.file) return asset.file.arrayBuffer();
  return (await fetch(asset.uri)).arrayBuffer();
}
