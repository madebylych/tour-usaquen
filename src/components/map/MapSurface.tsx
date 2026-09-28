import { Ref, useImperativeHandle, useRef } from 'react';
import { StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';

import { FromMap, parseFromMap, ToMap } from './bridge';

export type MapSurfaceHandle = { send: (msg: ToMap) => void };

type Props = {
  html: string;
  onMessage: (msg: FromMap) => void;
  ref?: Ref<MapSurfaceHandle>;
};

// Contenedor de la página del mapa en la app (Android / iOS): un WebView.
// En la vista previa web se usa MapSurface.web.tsx (iframe).
export default function MapSurface({ html, onMessage, ref }: Props) {
  const webRef = useRef<WebView>(null);

  useImperativeHandle(ref, () => ({
    send(msg) {
      webRef.current?.injectJavaScript(`window.receive && window.receive(${JSON.stringify(msg)}); true;`);
    },
  }));

  return (
    <WebView
      ref={webRef}
      source={{ html }}
      originWhitelist={['*']}
      style={StyleSheet.absoluteFill}
      onMessage={(event) => {
        const msg = parseFromMap(event.nativeEvent.data);
        if (msg) onMessage(msg);
      }}
      // El mapa maneja sus propios gestos; el WebView no debe desplazarse.
      scrollEnabled={false}
      bounces={false}
      overScrollMode="never"
      setSupportMultipleWindows={false}
      webviewDebuggingEnabled={__DEV__}
    />
  );
}
