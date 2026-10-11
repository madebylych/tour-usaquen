import type { DocumentPickerAsset } from 'expo-document-picker';
import { File } from 'expo-file-system';

// Contenido del archivo elegido (copiado a la caché por el selector).
export async function readPickedFile(asset: DocumentPickerAsset): Promise<ArrayBuffer> {
  const bytes = await new File(asset.uri).bytes();
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}
