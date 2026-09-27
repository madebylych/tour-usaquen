# Plan técnico: Tour Interactivo del Distrito Creativo de Usaquén

Versión 2, 2026-09-27. Reemplaza la versión 1 (PWA): el entregable es una **app nativa instalable (APK de Android)**, no una web.

Formato: app móvil con Expo (React Native), offline-first. Proyecto en `04_app/tour-usaquen/`.

---

## 1. Arquitectura técnica

```text
            (con internet, antes del tour)
┌──────────────┐   Descargar recorrido   ┌────────────────────────────┐
│  Supabase    │ ──────────────────────▶ │  App en el celular         │
│  PostgreSQL  │   datos de la ruta,     │                            │
│  Storage     │   imágenes, audios,     │  Almacenamiento de la app  │
└──────────────┘   mapa ilustrado        │   (expo-file-system)       │
                                         │   route.json + archivos    │
                                         │  Progreso (expo-sqlite     │
                                         │   kv-store)                │
                                         │  GPS (expo-location)       │
                                         └────────────────────────────┘
            (durante el tour: todo sale del celular, sin red)
```

Principios:

- **La app nunca lee de Supabase durante el tour.** Supabase solo se consulta al pulsar "Descargar recorrido". Los archivos quedan guardados en el almacenamiento de la app, que el sistema no borra por su cuenta.
- **Una sola capa de datos (`src/data/`)** decide de dónde salen los datos. El resto de la app no sabe si vienen de Supabase, de un JSON local o de archivos descargados.
- **Supabase entra tarde.** Las primeras fases usan datos locales con exactamente la forma de las tablas. Cuando se conecte Supabase, solo cambia `src/data/`.

### Ventajas frente a la PWA (por qué el cambio sí vale la pena)

- Es una app de verdad: APK instalable, icono propio, sin navegador.
- Los archivos descargados no los borra el navegador (en iOS/Safari eso era un riesgo real).
- Vibración (háptica) en Android y iPhone al descubrir una parada.
- Abre la puerta a detectar paradas con la pantalla bloqueada (geofencing), en una versión posterior.

### Dependencias y por qué

Todas son módulos de Expo o librerías recomendadas por Expo. Se instalan siempre con `npx expo install` para que la versión coincida con la SDK.

| Dependencia | Por qué | Estado |
|---|---|---|
| Expo SDK 57 + Expo Router | Base de la app y navegación entre pantallas por archivos. | Instalado |
| TypeScript | Atrapa errores en el modelo de datos (rutas, paradas, progreso). | Fase 0 |
| react-native-maps | Mapa, marcadores, línea de ruta y `Overlay` para el mapa ilustrado. Funciona en Expo Go sin configuración. | Instalado |
| expo-location | GPS: permiso y posición mientras se camina. | Instalado |
| expo-audio | Reproducir los audios de cada parada. | Instalado |
| expo-file-system | Descargar y guardar archivos de la ruta en el celular. | Fase 7 |
| expo-sqlite (`kv-store`) | Guardar el progreso (clave/valor, API tipo localStorage). | Fase 5 |
| expo-haptics | Vibración al descubrir una parada. | Fase 4 |
| expo-keep-awake | Evitar que la pantalla se apague durante el tour. | Fase 4 |
| @supabase/supabase-js | Cliente de Supabase (o `fetch` directo a la API REST, se decide en la fase 9). | Fase 9 |

**Sin librerías de UI ni de estado global.** `StyleSheet` con un archivo de tokens (`theme.ts`) y un Context para el tour activo son suficientes. Iconos: `@expo/vector-icons`, que ya viene con Expo.

---

## 2. Estructura de carpetas

```text
tour-usaquen/
├── assets/
│   ├── icon.png, splash...
│   └── sounds/ui/              sonidos de interfaz (van dentro de la app)
├── src/
│   ├── app/                    pantallas (Expo Router: cada archivo es una pantalla)
│   │   ├── _layout.tsx
│   │   ├── index.tsx           intro
│   │   ├── ruta/[slug].tsx     detalle de la ruta + descargar
│   │   ├── tour.tsx            mapa + progreso + siguiente parada
│   │   ├── lugar/[id].tsx      ficha del lugar
│   │   └── completado.tsx      final del recorrido
│   ├── types.ts                Place, Route, RoutePlace, Progress
│   ├── data/
│   │   ├── local/              SOLO fases 1-8: datos y archivos de prueba
│   │   ├── source.ts           de dónde vienen los datos (local o Supabase)
│   │   ├── download.ts         descarga una ruta al celular
│   │   └── progress.ts         lee/escribe progreso
│   ├── geo/
│   │   ├── distance.ts         Haversine
│   │   ├── useLocation.ts      permiso + watchPositionAsync + estados
│   │   ├── useProximity.ts     parada más cercana, ¿llegó?
│   │   └── simulator.ts        ubicación falsa para pruebas y presentaciones
│   ├── components/
│   │   ├── TourMap.tsx
│   │   ├── AudioPlayer.tsx
│   │   ├── DownloadButton.tsx
│   │   ├── Passport.tsx
│   │   ├── DiscoveryCard.tsx
│   │   └── LocationStatus.tsx
│   ├── context/
│   │   └── TourContext.tsx     ruta activa, progreso, ubicación
│   └── theme.ts                colores, tipografía, espacios
├── supabase/
│   └── schema.sql              tablas, índices y políticas (versionado en git)
├── app.json
└── eas.json                    perfil "preview" que genera el APK
```

---

## 3. Modelo de datos (Supabase)

Cambios respecto al borrador inicial y por qué:

- **Rutas de archivo en vez de URLs completas** (`image_path`, no `image_url`). Si cambia el proyecto o el bucket, no hay que editar cada fila.
- **`slug`** para identificar rutas y lugares de forma legible.
- **`version` en `routes`**: la app compara la versión descargada con la del servidor para saber si hay que actualizar. Es la base de la "sincronización".
- **Campos de contenido separados** (historia, arquitectura, "¿sabías que?", consigna de observación). Cada disciplina llena su campo.
- **Créditos** de imagen y audio, que se muestran en la ficha.
- **`published`** para que el grupo pueda cargar contenido a medias sin que aparezca en la app.

```sql
create table places (
  id                  uuid primary key default gen_random_uuid(),
  slug                text unique not null,
  name                text not null,
  category            text not null,
  latitude            double precision not null,
  longitude           double precision not null,
  activation_radius   integer not null default 30,    -- metros
  summary             text,                            -- 1-2 líneas
  history             text,
  architecture        text,
  did_you_know        text,
  observation_prompt  text,                            -- "Mira hacia arriba..."
  image_path          text,
  image_credit        text,
  audio_path          text,
  audio_title         text,
  audio_credit        text,
  sources             text,                            -- de dónde sale la información
  published           boolean not null default false,
  updated_at          timestamptz not null default now()
);

create table routes (
  id                  uuid primary key default gen_random_uuid(),
  slug                text unique not null,
  name                text not null,
  description         text,
  duration_min        integer,
  distance_m          integer,
  cover_image_path    text,
  map_image_path      text,        -- mapa ilustrado de la ruta
  map_bounds          jsonb,       -- [[lat_norte, lon_oeste], [lat_sur, lon_este]]
  version             integer not null default 1,
  published           boolean not null default false,
  updated_at          timestamptz not null default now()
);

create table route_places (
  route_id   uuid references routes(id) on delete cascade,
  place_id   uuid references places(id) on delete cascade,
  position   integer not null,
  primary key (route_id, place_id),
  unique (route_id, position)
);

-- Lectura pública solo de lo publicado. Nadie escribe desde la app:
-- el contenido se edita en el panel de Supabase.
alter table places enable row level security;
alter table routes enable row level security;
alter table route_places enable row level security;

create policy "public read places" on places for select using (published);
create policy "public read routes" on routes for select using (published);
create policy "public read route_places" on route_places for select using (true);
```

Storage: un bucket público `media`:

```text
media/
  images/places/   images/routes/   maps/
  audio/places/    audio/soundscapes/
```

Los sonidos de interfaz **no** van en Storage: son parte de la app (`assets/sounds/ui/`).

**El progreso no va a Supabase en el MVP.** Sin cuentas (Auth) no hay a quién asociarlo; se guarda en el celular.

La plantilla `02_investigacion/plantilla_lugares.csv` se ajustará a las columnas de `places` para que el grupo llene el contenido en el mismo formato.

---

## 4. Estrategia offline

| Qué | Dónde | Cuándo |
|---|---|---|
| La app (código, iconos, sonidos de UI) | Dentro del APK | Siempre disponible |
| Datos de una ruta | `Paths.document/routes/<slug>/route.json` | Al pulsar "Descargar recorrido" |
| Imágenes, audios, mapa ilustrado | `Paths.document/routes/<slug>/media/` | Al pulsar "Descargar recorrido" |
| Progreso, rutas descargadas | expo-sqlite `kv-store` | Al descubrir una parada |

Flujo de "Descargar recorrido":

1. Traer la ruta con sus paradas desde Supabase.
2. Armar la lista de archivos (imágenes, audios, mapa) y descargarlos uno por uno con `File.downloadFileAsync`, mostrando progreso ("4 de 9").
3. Reescribir las rutas de archivo del JSON para que apunten a los archivos locales y guardar `route.json`.
4. Guardar `{ slug, version, downloadedAt }`.
5. Solo si todo terminó, marcar la ruta como disponible offline. Si falla a medias, se puede reintentar.

Durante el tour, imágenes, audios y mapa se cargan desde `file://` en el celular.

**Sincronización:** al abrir la app con internet, se compara `version` de cada ruta descargada con la del servidor. Si cambió, se ofrece "Actualizar recorrido". No hay más que sincronizar en el MVP.

---

## 5. Estrategia de mapas

**Restricción:** la política de los tiles oficiales de OpenStreetMap prohíbe descargarlos por adelantado para uso offline (https://operations.osmfoundation.org/policies/tiles/). Y el mapa base de Google Maps no garantiza estar disponible sin conexión.

**Solución: mapa ilustrado georreferenciado** con el componente `Overlay` de react-native-maps. Es una imagen anclada por dos esquinas; el punto del GPS cae en el lugar correcto. Se descarga con la ruta, así que funciona offline. El mapa base de Google se ve debajo cuando hay conexión.

No es solo la opción barata: **un mapa ilustrado del distrito es parte de la identidad visual del proyecto.** Lo pueden trabajar juntas ilustración (creación digital) y arquitectura (lectura del territorio, recorridos, hitos).

Requisitos del mapa en imagen:
- Orientado al norte, sin rotar.
- Área pequeña (~1 km), así que la proyección plana no genera error visible.
- Peso objetivo: menos de 1 MB.

**API key de Google Maps:** en Expo Go el mapa funciona sin configurar nada. En el APK, Android necesita una API key de Google Maps (el SDK para Android es gratis e ilimitado en móvil, pero hay que crear un proyecto en Google Cloud, que puede pedir tarjeta). Si eso es un problema, la alternativa es MapLibre (sin API key), a costa de más configuración. Se decide en la fase 6.

---

## 6. Flujo UX principal

Con una sola ruta, "Explorar rutas → Seleccionar recorrido" son dos pantallas que no deciden nada. En el MVP la intro lleva directo a la ruta. La lista de rutas aparece cuando haya más de una.

```text
Intro (qué es, cómo se usa)
   ↓
Ruta: duración, distancia, paradas
   ↓
[Descargar recorrido]  (muestra progreso)
   ↓
[Comenzar tour]  → pide permiso de ubicación AQUÍ, no al abrir la app
   ↓
Tour: mapa + tu ubicación + siguiente parada + distancia + pasaporte (2/3)
   ↓
Al entrar en el radio de una parada:
   vibración + sonido de descubrimiento + tarjeta "Descubriste: ..."
   ↓
Ficha: imagen, consigna de observación, audio, historia, arquitectura, ¿sabías que?
   ↓
Volver al tour → siguiente parada
   ↓
Final: pasaporte completo, créditos del equipo
```

Decisiones de UX:

- **La consigna de observación va arriba del texto.** "Mira la fachada frente a ti" antes que tres párrafos de historia.
- **"Descubierta" es automático (GPS) y además hay un botón "Ya estoy aquí".** El GPS en calles con edificios falla por 10-30 m. Nadie debe quedarse bloqueado frente a una parada.
- **No hay paso separado de "Marcar como visitada".** Descubrir ya marca la parada.
- **El orden es sugerido, no obligatorio.** Si alguien llega primero a la parada 3, se descubre igual.
- **Si se niega el permiso de ubicación**, el tour funciona con el botón manual.

**Modo simulación (imprescindible):** un interruptor de desarrollo que reemplaza el GPS por una posición que se mueve tocando el mapa. Sirve para desarrollar sin caminar por Usaquén y para **presentar en clase**.

---

## 7. Componentes principales

| Componente | Responsabilidad |
|---|---|
| `TourContext` | Ruta activa, progreso, posición actual, parada más cercana. |
| `useLocation` | Permiso, `watchPositionAsync`, estados (pidiendo, activo, denegado, sin señal), precisión. En simulación devuelve la posición simulada. |
| `useProximity` | Distancia a cada parada, siguiente parada, detecta la entrada al radio (con tolerancia para no disparar dos veces por saltos del GPS). |
| `TourMap` | react-native-maps: mapa ilustrado (`Overlay`) + marcadores + línea de ruta + punto del usuario. |
| `DownloadButton` | Estados: no descargada, descargando (n de m), descargada, desactualizada, error. |
| `AudioPlayer` | Reproduce el audio local, play/pausa, progreso, créditos. |
| `DiscoveryCard` | Tarjeta al descubrir una parada; dispara vibración y sonido. |
| `Passport` | Paradas descubiertas / total, sellos. |
| `LocationStatus` | Informa precisión o problemas del GPS en lenguaje claro. |

---

## 8. MVP: qué entra

- 1 ruta, 3 paradas.
- Intro, ruta, tour, ficha, final.
- Mapa con marcadores, línea de ruta y mapa ilustrado (provisional hasta tener el final).
- GPS, distancia, parada más cercana, detección por radio, botón manual, modo simulación.
- Ficha con imagen, consigna, 1 audio, textos, créditos.
- Progreso guardado + pasaporte simple (n / 3) + pantalla final.
- Descarga offline de la ruta + prueba en modo avión.
- Supabase como fuente de contenido (al final del MVP).
- Sonido de descubrimiento (1 archivo de los músicos) + vibración.
- **APK de Android** generado con EAS Build (plan gratis).

## 9. Para versiones posteriores

- Varias rutas y pantalla para escoger ruta.
- Detección de paradas con la pantalla bloqueada (geofencing en segundo plano; requiere permiso de ubicación "siempre").
- Paisajes sonoros por zona (el sonido cambia según dónde estás), mezcla de capas de audio.
- Sellos ilustrados y logros más allá del contador.
- Cuentas (Supabase Auth) y progreso sincronizado entre dispositivos.
- Varios audios por parada (tabla `place_media`).
- Idioma inglés.
- Versión web (Expo puede generarla, pero el mapa necesita otra solución en web).
- Versión iPhone instalable (requiere cuenta de Apple Developer, USD 99/año; para la presentación basta Expo Go).

---

## 10. Orden de desarrollo

Cada fase termina con una prueba concreta. No se avanza si la prueba falla. Durante el desarrollo se prueba en el celular con **Expo Go**.

| Fase | Qué | Prueba |
|---|---|---|
| 0 | Pasar el proyecto a TypeScript, reorganizar pantallas según esta estructura, repo en GitHub | La app abre en Expo Go en el celular |
| 1 | Tipos + datos locales con 3 paradas de prueba + pantallas sin mapa | Se navega intro → ruta → ficha |
| 2 | `TourMap`: marcadores + línea de ruta | Se ven las 3 paradas en su sitio |
| 3 | `useLocation` + modo simulación | El punto se mueve al caminar y al tocar el mapa en simulación |
| 4 | `useProximity` + descubrimiento (vibración, sonido) + botón manual + pantalla encendida | Entrar al radio (real o simulado) dispara la tarjeta una sola vez |
| 5 | Progreso guardado + pasaporte + pantalla final | Cerrar y abrir la app conserva el progreso |
| 6 | **Primer APK** con EAS Build (incluye API key de Google Maps) | El APK se instala en un Android y el mapa se ve |
| 7 | Descarga de ruta al celular + lectura desde archivos locales | Modo avión: se ven fichas, imágenes y suenan los audios |
| 8 | Mapa ilustrado con `Overlay` | Modo avión: se ve el mapa y el punto cae donde es |
| 9 | Supabase: `schema.sql`, bucket, `source.ts` lee de Supabase | Cambiar un texto en Supabase, actualizar la ruta y verlo en la app |
| 10 | Identidad visual y sonidos de interfaz | Revisión de diseño + prueba real en Usaquén |
| 11 | APK final | Instalación limpia en un Android y recorrido completo |

El primer APK va en la fase 6, no al final: así se confirma temprano que la compilación y el mapa funcionan fuera de Expo Go.

La prueba real en Usaquén conviene hacerla **después de la fase 5**: es donde aparecen los problemas de GPS reales.

---

## Riesgos principales

1. **Contenido del grupo a tiempo** (textos, audios, fotos, coordenadas). Es el cuello de botella, no el código.
2. **GPS impreciso** en calles estrechas: se mitiga con radios de 30-50 m y el botón manual.
3. **API key de Google Maps** para el APK: requiere cuenta de Google Cloud. Alternativa: MapLibre.
4. **Supabase gratis se pausa tras 7 días sin actividad.** Una ruta ya descargada sigue funcionando, pero una descarga nueva fallaría. Antes de la presentación: entrar al panel y comprobar que el proyecto está activo (https://supabase.com/docs/guides/platform/free-project-pausing).
5. **Fecha de entrega sin confirmar:** define cuántas fases se alcanzan.
6. **iPhone:** sin cuenta de Apple Developer, en iPhone solo se puede mostrar con Expo Go.
