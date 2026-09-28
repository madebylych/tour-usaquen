import { useEffect, useState } from 'react';
import * as Location from 'expo-location';

import { Coordinates } from './distance';
import { useSimulator } from './simulator';

export type LocationStatus =
  | 'requesting' // pidiendo permiso o esperando la primera señal
  | 'active' // hay posición
  | 'denied' // la persona no dio permiso
  | 'unavailable' // GPS apagado o error del sistema
  | 'simulated'; // modo simulación

export type UserLocation = {
  status: LocationStatus;
  position: Coordinates | null;
  accuracy: number | null; // metros; null en simulación
};

// Posición del usuario mientras camina. Si el modo simulación está activo,
// devuelve la posición simulada y el resto de la app no nota la diferencia.
export function useLocation(): UserLocation {
  const sim = useSimulator();
  const [real, setReal] = useState<UserLocation>({
    status: 'requesting',
    position: null,
    accuracy: null,
  });

  useEffect(() => {
    let subscription: Location.LocationSubscription | null = null;
    let cancelled = false;

    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (cancelled) return;
      if (status !== 'granted') {
        setReal({ status: 'denied', position: null, accuracy: null });
        return;
      }
      try {
        subscription = await Location.watchPositionAsync(
          // High: GPS a nivel de calle. distanceInterval evita actualizar
          // la pantalla por movimientos de menos de 3 m.
          { accuracy: Location.Accuracy.High, distanceInterval: 3, timeInterval: 2000 },
          (location) =>
            setReal({
              status: 'active',
              position: { latitude: location.coords.latitude, longitude: location.coords.longitude },
              accuracy: location.coords.accuracy,
            })
        );
        // Si la pantalla se cerró mientras se pedía el GPS, se suelta de inmediato.
        if (cancelled) subscription.remove();
      } catch {
        if (!cancelled) setReal({ status: 'unavailable', position: null, accuracy: null });
      }
    })();

    return () => {
      cancelled = true;
      subscription?.remove();
    };
  }, []);

  if (sim.enabled) return { status: 'simulated', position: sim.position, accuracy: null };
  return real;
}
