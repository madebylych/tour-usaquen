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

Requiere una cuenta gratuita de Expo. Ver `eas.json`.

## Estructura

```text
src/
  app/          pantallas (Expo Router: cada archivo es una pantalla)
  components/   componentes reutilizables
  data/         acceso a datos (source.ts es la única puerta de entrada)
    local/      datos de prueba con la forma de las tablas de Supabase
  utils/        funciones auxiliares (formato)
  types.ts      tipos del modelo de datos
  theme.ts      colores, espacios y tipografía
```

El plan técnico completo (arquitectura, modelo de datos, fases) está en `docs/PLAN_TECNICO.md`.
