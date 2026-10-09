import { useCallback, useEffect, useState } from 'react';

type State<T> =
  | { status: 'loading' }
  | { status: 'ready'; data: T }
  | { status: 'error'; error: unknown };

// Ejecuta una función async de source.ts y expone su estado a la pantalla.
// `key` indica cuándo volver a cargar (por ejemplo, el slug de la ruta).
// El resultado se guarda junto con su key: si la key cambió, lo guardado es
// de una carga anterior y se considera "cargando".
// `reload` vuelve a cargar con la misma key (botón "Reintentar").
export function useData<T>(load: () => Promise<T>, key: string): State<T> & { reload: () => void } {
  const [attempt, setAttempt] = useState(0);
  const fullKey = `${key}#${attempt}`;
  const [result, setResult] = useState<{ key: string; state: State<T> } | null>(null);

  useEffect(() => {
    let active = true;
    load()
      .then((data) => active && setResult({ key: fullKey, state: { status: 'ready', data } }))
      .catch((error) => active && setResult({ key: fullKey, state: { status: 'error', error } }));
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fullKey]);

  const reload = useCallback(() => setAttempt((n) => n + 1), []);

  // Ojo: no usar `result?.key === key`. Si result es null y key llega
  // undefined, esa comparación da true y se lee result.state de null.
  const state: State<T> = result !== null && result.key === fullKey ? result.state : { status: 'loading' };
  return { ...state, reload };
}
