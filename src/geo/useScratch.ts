import { useEffect, useMemo } from 'react';

import { MapFog } from '@/components/map/bridge';
import { scratch, useScratchState } from '@/data/scratch';
import { Place } from '@/types';
import { buildGrid, HEX_RADIUS_M, keysAround } from './scratch';
import { streetPath } from './streetPath';
import { MAX_ACCURACY_FOR_DISCOVERY_M } from './useProximity';
import { UserLocation } from './useLocation';

// Une el GPS con el mapa para raspar: destapa lo que rodea a la persona y
// entrega la niebla, el % explorado y lo caminado.
export function useScratch(places: Place[], location: UserLocation) {
  const { position, accuracy } = location;
  const { revealed, walkedM, newZones } = useScratchState();
  const grid = useMemo(() => buildGrid(streetPath(places)), [places]);

  useEffect(() => {
    scratch.beginSession();
  }, []);

  useEffect(() => {
    if (!position) return;
    // Con mala señal el punto salta y destaparía calles donde no se estuvo.
    if (accuracy != null && accuracy > MAX_ACCURACY_FOR_DISCOVERY_M) return;
    scratch.record(position, keysAround(position, grid));
  }, [position, accuracy, grid]);

  const fog = useMemo<MapFog | null>(() => {
    if (grid.zone.length === 0) return null;
    return { type: 'fog', radius: HEX_RADIUS_M, cosLat: grid.cosLat, revealed: Object.keys(revealed) };
  }, [grid, revealed]);

  return { fog, ...exploredOf(grid.zone, revealed), walkedM, newZones };
}

// Solo lectura (Pasaporte): % explorado y lo caminado, sin tocar el GPS.
export function useExplored(places: Place[]) {
  const { revealed, walkedM } = useScratchState();
  const zone = useMemo(() => buildGrid(streetPath(places)).zone, [places]);
  return { ...exploredOf(zone, revealed), walkedM };
}

function exploredOf(zone: string[], revealed: Record<string, true>) {
  const explored = zone.filter((key) => key in revealed).length;
  const ratio = zone.length > 0 ? explored / zone.length : 0;
  // Nunca dice 0 % si ya destapó algo, ni 100 % si le falta algo por destapar.
  const percent = explored === 0 ? 0 : explored === zone.length ? 100 : Math.min(99, Math.max(1, Math.round(ratio * 100)));
  return { percent, ratio };
}
