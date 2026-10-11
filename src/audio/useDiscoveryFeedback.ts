import { useCallback } from 'react';
import { useAudioPlayer } from 'expo-audio';
import * as Haptics from 'expo-haptics';

import { setPlayerVolume } from '@/audio/volume';
import { settings } from '@/data/settings';

// Sonido PROVISIONAL generado con scripts/generar_sonido_descubrimiento.py.
// Se reemplaza por el del equipo de música con el mismo nombre de archivo.
const DISCOVERY_SOUND = require('../../assets/sounds/ui/discovery.wav');

// Vibración + sonido al descubrir una parada, según los Ajustes
// (volumen de "sonidos de la app" y vibración).
export function useDiscoveryFeedback() {
  const player = useAudioPlayer(DISCOVERY_SOUND);

  return useCallback(() => {
    const { haptics, uiVolume } = settings.get();
    if (haptics) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    if (uiVolume === 0) return;
    setPlayerVolume(player, uiVolume);
    // Volver al inicio por si el sonido ya se reprodujo antes.
    player.seekTo(0).then(() => player.play()).catch(() => {});
  }, [player]);
}
