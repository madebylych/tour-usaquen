import { useEffect, useState } from 'react';
import * as Location from 'expo-location';

// Pide permiso de ubicación y devuelve la posición del usuario, actualizada
// mientras camina. `ubicacion` es null hasta que haya permiso y señal.
export function useUbicacion() {
  const [ubicacion, setUbicacion] = useState(null);
  const [permisoDenegado, setPermisoDenegado] = useState(false);

  useEffect(() => {
    let suscripcion;

    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setPermisoDenegado(true);
        return;
      }
      suscripcion = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.Balanced, distanceInterval: 10 },
        (posicion) => setUbicacion(posicion.coords)
      );
    })();

    return () => suscripcion?.remove();
  }, []);

  return { ubicacion, permisoDenegado };
}
