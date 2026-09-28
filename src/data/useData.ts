import { useEffect, useState } from 'react';

type State<T> =
  | { status: 'loading' }
  | { status: 'ready'; data: T }
  | { status: 'error'; error: unknown };

// Ejecuta una función async de source.ts y expone su estado a la pantalla.
// `key` indica cuándo volver a cargar (por ejemplo, el slug de la ruta).
// El resultado se guarda junto con su key: si la key cambió, lo guardado es
// de una carga anterior y se considera "cargando".
export function useData<T>(load: () => Promise<T>, key: string): State<T> {
  const [result, setResult] = useState<{ key: string; state: State<T> } | null>(null);

  useEffect(() => {
    let active = true;
    load()
      .then((data) => active && setResult({ key, state: { status: 'ready', data } }))
      .catch((error) => active && setResult({ key, state: { status: 'error', error } }));
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  // Ojo: no usar `result?.key === key`. Si result es null y key llega
  // undefined, esa comparación da true y se lee result.state de null.
  return result !== null && result.key === key ? result.state : { status: 'loading' };
}
