import type { AudioPlayer } from 'expo-audio';

import { toVolume } from '@/data/settings';

// Cambia el volumen de un reproductor (nivel 0 a 5 de Ajustes). Va en una
// función aparte porque las reglas de React no dejan modificar lo que
// devuelve un hook directamente en el componente, aunque `volume` es la
// forma documentada de expo-audio.
export function setPlayerVolume(player: AudioPlayer, step: number) {
  player.volume = toVolume(step);
}
