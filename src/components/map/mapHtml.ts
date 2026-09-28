import { colors } from '@/theme';
import { MAPLIBRE_CSS, MAPLIBRE_JS } from './vendor/maplibre.generated';

// Página HTML del mapa: MapLibre GL JS + tiles vectoriales de OpenFreeMap
// (datos de OpenStreetMap; gratis, sin API key). Se muestra dentro de un
// WebView en la app y de un iframe en la vista previa web.
//
// Funciona sin conexión:
// - MapLibre va dentro de la app (vendor/maplibre.generated.ts), no en un CDN.
// - Si el estilo de OpenFreeMap no carga, se usa un fondo liso.
// - El mapa ilustrado de la ruta (imagen descargada) se dibuja encima,
//   anclado por sus esquinas; es el mapa que se ve sin conexión.
//
// MapLibre 5.x porque trae todo en un solo archivo (la 6.x viene en módulos
// separados, más frágil dentro de un WebView).

const STYLE_URL = 'https://tiles.openfreemap.org/styles/positron';
const STYLE_TIMEOUT_MS = 5000;

export function buildMapHtml(): string {
  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
<style>${MAPLIBRE_CSS}</style>
<style>
  html, body, #map { margin: 0; padding: 0; width: 100%; height: 100%; background: ${colors.primarySoft}; }
  body { -webkit-tap-highlight-color: transparent; font-family: -apple-system, 'Segoe UI', Roboto, sans-serif; }
  .pin {
    width: 34px; height: 34px; box-sizing: border-box; border-radius: 50%;
    background: ${colors.primary}; border: 3px solid ${colors.surface};
    color: ${colors.onPrimary}; font-weight: 800; font-size: 15px;
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 4px 14px rgba(28, 27, 31, 0.18); cursor: pointer; position: relative;
    transition: transform 0.15s;
  }
  .pin.selected { background: ${colors.surface}; border-color: ${colors.primary}; color: ${colors.primary}; transform: scale(1.2); }
  .pin .check {
    position: absolute; top: -7px; right: -7px; width: 18px; height: 18px; box-sizing: border-box;
    border-radius: 50%; background: ${colors.primaryDark}; border: 2px solid ${colors.surface};
    color: ${colors.onPrimary}; font-size: 10px; display: flex; align-items: center; justify-content: center;
  }
  .user {
    width: 20px; height: 20px; box-sizing: border-box; border-radius: 50%;
    background: ${colors.primaryDark}; border: 3px solid ${colors.surface};
    box-shadow: 0 0 0 6px rgba(209, 0, 111, 0.25);
  }
  .user.sim { width: 26px; height: 26px; border-style: dashed; }
  .maplibregl-ctrl-attrib { font-size: 10px; }
</style>
</head>
<body>
<div id="map"></div>
<script>${MAPLIBRE_JS}</script>
<script>
(function () {
  var PRIMARY = '${colors.primary}';

  // Envía un mensaje a la app (WebView) o a la página que contiene el iframe.
  function send(msg) {
    if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(JSON.stringify(msg));
    else if (window.parent !== window) window.parent.postMessage({ __tourMap: true, msg: msg }, '*');
  }

  window.onerror = function (message) { send({ type: 'error', message: String(message) }); };
  if (typeof maplibregl === 'undefined') {
    send({ type: 'error', message: 'No se pudo iniciar la librería del mapa' });
    return;
  }

  // Estilo sin conexión: solo un fondo liso (no necesita tiles ni fuentes).
  var OFFLINE_STYLE = {
    version: 8,
    sources: {},
    layers: [{ id: 'background', type: 'background', paint: { 'background-color': '${colors.background}' } }]
  };

  // Intenta traer el estilo de OpenFreeMap; si no hay conexión (o tarda
  // demasiado), sigue con el fondo liso.
  function loadStyle() {
    var controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    var timer = setTimeout(function () { if (controller) controller.abort(); }, ${STYLE_TIMEOUT_MS});
    return fetch('${STYLE_URL}', controller ? { signal: controller.signal } : undefined)
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(function (style) { clearTimeout(timer); return { style: style, online: true }; })
      .catch(function () { clearTimeout(timer); return { style: OFFLINE_STYLE, online: false }; });
  }

  var map = null;
  var loaded = false;
  var pending = null; // último estado recibido antes de que cargue el mapa
  var fitted = false;
  var markers = {}; // id -> { marker, el }
  var userMarker = null;
  var userEl = null;
  var currentImageUrl = null;

  // Círculo aproximado (polígono de 48 lados) de radio en metros.
  function circle(lat, lng, radius) {
    var points = [];
    var dLat = radius / 111320;
    var dLng = radius / (111320 * Math.cos(lat * Math.PI / 180));
    for (var i = 0; i <= 48; i++) {
      var a = (i / 48) * 2 * Math.PI;
      points.push([lng + dLng * Math.cos(a), lat + dLat * Math.sin(a)]);
    }
    return { type: 'Feature', geometry: { type: 'Polygon', coordinates: [points] }, properties: {} };
  }

  var EMPTY = { type: 'FeatureCollection', features: [] };

  // Esquinas de la imagen para MapLibre: [lng, lat] en orden
  // superior izquierda, superior derecha, inferior derecha, inferior izquierda.
  // bounds llega como [[lat_norte, lon_oeste], [lat_sur, lon_este]].
  function corners(bounds) {
    var n = bounds[0][0], w = bounds[0][1], s = bounds[1][0], e = bounds[1][1];
    return [[w, n], [e, n], [e, s], [w, s]];
  }

  function setIllustratedMap(image) {
    var url = image ? image.url : null;
    if (url === currentImageUrl) return;
    currentImageUrl = url;
    if (map.getLayer('illustrated')) map.removeLayer('illustrated');
    if (map.getSource('illustrated')) map.removeSource('illustrated');
    if (!image) return;
    map.addSource('illustrated', { type: 'image', url: image.url, coordinates: corners(image.bounds) });
    // Debajo de la precisión, la ruta y los marcadores.
    map.addLayer({ id: 'illustrated', type: 'raster', source: 'illustrated', paint: { 'raster-fade-duration': 0 } }, 'accuracy');
  }

  function apply(state) {
    setIllustratedMap(state.mapImage);

    // Línea de la ruta.
    map.getSource('route').setData({
      type: 'Feature', properties: {},
      geometry: { type: 'LineString', coordinates: state.places.map(function (p) { return [p.lng, p.lat]; }) }
    });

    // Marcadores de las paradas: se crean una vez y se actualizan.
    var seen = {};
    state.places.forEach(function (p) {
      seen[p.id] = true;
      var entry = markers[p.id];
      if (!entry) {
        // El contenedor lo maneja MapLibre (posición absoluta con su clase
        // maplibregl-marker); el estilo va en un elemento interno para no
        // pisar esa clase.
        var container = document.createElement('div');
        var el = document.createElement('div');
        container.appendChild(el);
        el.addEventListener('click', function (ev) {
          ev.stopPropagation();
          send({ type: 'select', id: p.id });
        });
        entry = { el: el, marker: new maplibregl.Marker({ element: container }).setLngLat([p.lng, p.lat]).addTo(map) };
        markers[p.id] = entry;
      }
      entry.marker.setLngLat([p.lng, p.lat]);
      entry.el.className = 'pin' + (p.id === state.selectedId ? ' selected' : '');
      entry.el.setAttribute('aria-label', 'Parada ' + p.n);
      entry.el.innerHTML = String(p.n) + (state.discovered.indexOf(p.id) >= 0 ? '<span class="check">&#10003;</span>' : '');
    });
    Object.keys(markers).forEach(function (id) {
      if (!seen[id]) { markers[id].marker.remove(); delete markers[id]; }
    });

    // Posición del usuario y círculo de precisión.
    var u = state.user;
    if (u) {
      if (!userMarker) {
        var userContainer = document.createElement('div');
        userEl = document.createElement('div');
        userContainer.appendChild(userEl);
        userMarker = new maplibregl.Marker({ element: userContainer }).setLngLat([u.lng, u.lat]).addTo(map);
      }
      userMarker.setLngLat([u.lng, u.lat]);
      userEl.className = 'user' + (u.simulated ? ' sim' : '');
      map.getSource('accuracy').setData(u.accuracy ? circle(u.lat, u.lng, u.accuracy) : EMPTY);
    } else {
      if (userMarker) { userMarker.remove(); userMarker = null; }
      map.getSource('accuracy').setData(EMPTY);
    }

    // La primera vez, encuadrar el mapa ilustrado (si hay) o las paradas.
    if (!fitted && state.places.length > 0) {
      var bounds = new maplibregl.LngLatBounds();
      if (state.mapImage) corners(state.mapImage.bounds).forEach(function (c) { bounds.extend(c); });
      else state.places.forEach(function (p) { bounds.extend([p.lng, p.lat]); });
      map.fitBounds(bounds, { padding: { top: 70, right: 30, bottom: 40, left: 30 }, maxZoom: 17, duration: 0 });
      fitted = true;
    }
  }

  loadStyle().then(function (result) {
    map = new maplibregl.Map({
      container: 'map',
      style: result.style,
      center: [-74.0308, 4.6948],
      zoom: 15,
      attributionControl: { compact: true },
      pitchWithRotate: false,
      dragRotate: false
    });
    map.touchZoomRotate.disableRotation();

    map.on('load', function () {
      map.addSource('route', { type: 'geojson', data: EMPTY });
      map.addSource('accuracy', { type: 'geojson', data: EMPTY });
      map.addLayer({
        id: 'accuracy', type: 'fill', source: 'accuracy',
        paint: { 'fill-color': PRIMARY, 'fill-opacity': 0.1, 'fill-outline-color': PRIMARY }
      });
      map.addLayer({
        id: 'route', type: 'line', source: 'route',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: { 'line-color': PRIMARY, 'line-width': 5 }
      });
      loaded = true;
      if (pending) apply(pending);
      send({ type: 'ready', online: result.online });
    });

    // Errores de tiles sin conexión son esperables: solo se informan antes
    // de que el mapa cargue.
    map.on('error', function (e) {
      if (!loaded) send({ type: 'error', message: (e && e.error && e.error.message) || 'Error del mapa' });
    });

    // Toques en el mapa (no en un marcador): posición para el modo simulación.
    map.on('click', function (e) {
      var target = e.originalEvent && e.originalEvent.target;
      if (target && target.closest && target.closest('.pin')) return;
      send({ type: 'press', lat: e.lngLat.lat, lng: e.lngLat.lng });
    });
  });

  // Punto de entrada de los mensajes de la app.
  window.receive = function (msg) {
    if (!msg) return;
    if (msg.type === 'state') {
      if (loaded) apply(msg); else pending = msg;
    } else if (msg.type === 'center' && loaded) {
      map.easeTo({ center: [msg.lng, msg.lat], zoom: Math.max(map.getZoom(), 16), duration: 400 });
    }
  };

  // En la vista previa web los mensajes llegan por postMessage.
  window.addEventListener('message', function (e) {
    if (e.data && e.data.__tourMap && e.data.toMap) window.receive(e.data.msg);
  });
})();
</script>
</body>
</html>`;
}
