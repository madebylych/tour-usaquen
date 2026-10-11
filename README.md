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

Funciona sin conexión:
- MapLibre va dentro de la app (`src/components/map/vendor/maplibre.generated.ts`). Si se cambia la versión de `maplibre-gl` en `package.json`, regenerarlo con `node scripts/empaquetar-maplibre.js`.
- Sin conexión el mapa base se reemplaza por un fondo liso.
- El **mapa ilustrado** de la ruta (`map_image_path` + `map_bounds`) se descarga con la ruta y se dibuja anclado por sus esquinas. Debe estar orientado al norte y abarcar exactamente el área de `map_bounds`.

## Modo simulación

Para probar o presentar sin estar en Usaquén: en la pantalla del tour, **mantener presionada** la píldora de ubicación que está sobre el mapa. Se pone fucsia y dice "Simulación". Desde ahí, tocar el mapa mueve tu posición. Otra pulsación larga vuelve al GPS real.

Funciona también en el APK (está escondido a propósito, no desactivado).

## Contenido (Supabase) y descarga offline

El contenido (rutas, paradas, imágenes, audios, mapas) vive en **Supabase**: tablas `routes`, `places`, `route_places` y el bucket público `media`. La estructura está en `supabase/schema.sql` (se ejecuta una vez en el SQL Editor).

Variables en `.env.local` (no se sube a git):

```
EXPO_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...   # va en la app; solo lee lo publicado
SUPABASE_SECRET_KEY=sb_secret_...                          # SOLO para el script de carga
```

Para los APK, las dos variables públicas van en `eas.json`. La clave secreta nunca va en la app ni en git.

Sin esas variables, la app usa la ruta incluida en `src/data/local/ruta_usaquen.json` (sin fotos ni audios, sin descarga).

El contenido de la ruta (textos, coordenadas, fuentes) se edita en `src/data/local/ruta_usaquen.json`. Para subirlo:

```sh
py scripts/generar_contenido.py              # crea content/ desde el JSON (no se sube a git)
py scripts/subir_contenido_supabase.py       # sube archivos y filas; se puede repetir
```

Para que la app ofrezca "Actualizar" a quien ya descargó una ruta, subir el número `version` de la ruta.

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
