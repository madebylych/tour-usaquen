import { useCallback } from 'react';
import { useAudioPlayer } from 'expo-audio';
import * as Haptics from 'expo-haptics';

// Sonido PROVISIONAL generado con scripts/generar_sonido_descubrimiento.py.
// Se reemplaza por el del equipo de música con el mismo nombre de archivo.
const DISCOVERY_SOUND = require('../../assets/sounds/ui/discovery.wav');

// Vibración + sonido al descubrir una parada.
export function useDiscoveryFeedback() {
  const player = useAudioPlayer(DISCOVERY_SOUND);

  return useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    // Volver al inicio por si el sonido ya se reprodujo antes.
    player.seekTo(0).then(() => player.play()).catch(() => {});
  }, [player]);
}
