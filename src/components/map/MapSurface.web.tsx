import { Ref, useEffect, useImperativeHandle, useRef } from 'react';

import { FromMap, parseFromMap, ToMap } from './bridge';

export type MapSurfaceHandle = { send: (msg: ToMap) => void };

type Props = {
  html: string;
  onMessage: (msg: FromMap) => void;
  ref?: Ref<MapSurfaceHandle>;
};

// Vista previa web: la misma página del mapa dentro de un iframe.
export default function MapSurface({ html, onMessage, ref }: Props) {
  const frameRef = useRef<HTMLIFrameElement>(null);

  useImperativeHandle(ref, () => ({
    send(msg) {
      frameRef.current?.contentWindow?.postMessage({ __tourMap: true, toMap: true, msg }, '*');
    },
  }));

  useEffect(() => {
    const listener = (event: MessageEvent) => {
      if (event.source !== frameRef.current?.contentWindow) return;
      const data = event.data as { __tourMap?: boolean; msg?: unknown } | null;
      if (!data?.__tourMap) return;
      const msg = parseFromMap(data.msg);
      if (msg) onMessage(msg);
    };
    window.addEventListener('message', listener);
    return () => window.removeEventListener('message', listener);
  }, [onMessage]);

  return (
    <iframe
      ref={frameRef}
      srcDoc={html}
      title="Mapa del recorrido"
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }}
    />
  );
}
