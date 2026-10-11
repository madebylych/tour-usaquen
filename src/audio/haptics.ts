import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

import { settings } from '@/data/settings';

// Vibraciones cortas de la interfaz. Respetan Ajustes > Vibración y no hacen
// nada en la web.
const enabled = () => Platform.OS !== 'web' && settings.get().haptics;

// Toque leve: botones, boletos, opciones.
export function tap() {
  if (enabled()) Haptics.selectionAsync().catch(() => {});
}

// Golpe un poco más marcado: algo cambió de estado (descarga lista, pin).
export function thud() {
  if (enabled()) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
}
