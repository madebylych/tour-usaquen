# Tour Distrito Creativo de Usaquén

App móvil (Expo / React Native) para recorrer el Distrito Creativo de Usaquén, Bogotá: tour geolocalizado, cultural, arquitectónico y sonoro, con funcionamiento offline.

Proyecto universitario interdisciplinar (Creación Digital, Arquitectura y Música), Universidad El Bosque.

## Requisitos

- Node.js 20 o superior
- App **Expo Go** en el celular (Android o iPhone)

## Correr en desarrollo

```sh
npm install
npx expo start
```

Escanear el código QR con Expo Go. El celular y el computador deben estar en la misma red wifi.

## Mapa

MapLibre GL JS + tiles de [OpenFreeMap](https://openfreemap.org/) (datos de OpenStreetMap), dentro de un WebView. No necesita API key ni cuenta. La página del mapa está en `src/components/map/mapHtml.ts`.

## Modo simulación

Para probar o presentar sin estar en Usaquén: en la pantalla del tour, **mantener presionada** la píldora de ubicación que está sobre el mapa. Se pone fucsia y dice "Simulación". Desde ahí, tocar el mapa mueve tu posición. Otra pulsación larga vuelve al GPS real.

Funciona también en el APK (está escondido a propósito, no desactivado).

## Contenido y descarga offline

Sin servidor de contenido, la app usa los datos de prueba incluidos (sin fotos ni audios, sin descarga). Para probar la descarga offline con contenido de prueba en la red local:

```sh
python scripts/generar_contenido_prueba.py               # crea content/ (no se sube a git)
python -m http.server 8088 --bind 0.0.0.0 --directory content
```

y en `.env.local` (no se sube a git):

```
EXPO_PUBLIC_CONTENT_BASE_URL=http://IP-DEL-COMPUTADOR:8088
```

Reiniciar con `npx expo start --clear`. Funciona en Expo Go; el APK no permite servidores `http://` sin cifrar (en la fase 9 el contenido pasa a Supabase, con `https://`).

Las rutas descargadas quedan en el almacenamiento de la app (`routes/{slug}/`) y se leen sin conexión.

## Sonidos provisionales

`assets/sounds/ui/discovery.wav` (sonido al descubrir una parada) es provisional y se genera con:

```sh
python scripts/generar_sonido_descubrimiento.py
```

Para usar el sonido definitivo del equipo de música, reemplazar el archivo con el mismo nombre.

## Comprobaciones

```sh
npx tsc --noEmit     # tipos
npx expo lint        # lint
npx expo-doctor      # dependencias y configuración
```

## Generar el APK (Android)

```sh
npx eas-cli@latest build -p android --profile preview
```

Requiere una cuenta gratuita de Expo (no necesita Google Cloud ni tarjeta). Ver `eas.json`.

## Estructura

```text
src/
  app/          pantallas (Expo Router: cada archivo es una pantalla)
  components/   componentes reutilizables
  geo/          ubicación, distancias, detección de paradas y modo simulación
  audio/        sonido y vibración de descubrimiento
  data/         acceso a datos (source.ts es la única puerta de entrada)
    local/      datos de prueba con la forma de las tablas de Supabase
  utils/        funciones auxiliares (formato)
  types.ts      tipos del modelo de datos
  theme.ts      colores, espacios y tipografía
```

El plan técnico completo (arquitectura, modelo de datos, fases) está en `docs/PLAN_TECNICO.md`.
