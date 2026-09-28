import { useEffect } from 'react';

import { Place } from '@/types';
import { distanceInMeters } from './distance';
import { UserLocation } from './useLocation';
import { progress } from '@/data/progress';

// Si el GPS dice que su error es mayor que esto, no se descubre nada
// automáticamente: el punto puede "saltar" y descubrir paradas donde la
// persona no está. En ese caso queda el botón "Ya estoy aquí".
export const MAX_ACCURACY_FOR_DISCOVERY_M = 50;

// Descubre las paradas en cuyo radio de activación entra el usuario.
// `onDiscover` recibe solo las paradas nuevas (vibración, sonido).
// Una parada se descubre una sola vez: saltos del GPS dentro y fuera del
// radio no la vuelven a disparar.
export function useProximity(
  places: Place[],
  location: UserLocation,
  onDiscover: (placeIds: string[]) => void
) {
  const { position, accuracy } = location;

  useEffect(() => {
    if (!position) return;
    if (accuracy != null && accuracy > MAX_ACCURACY_FOR_DISCOVERY_M) return;

    const inside = places
      .filter((place) => distanceInMeters(position, place) <= place.activation_radius)
      .map((place) => place.id);

    const fresh = progress.discover(inside, { announce: true });
    if (fresh.length > 0) onDiscover(fresh);
    // onDiscover se omite a propósito: solo importa cuando cambia la posición.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [position, accuracy, places]);
}
