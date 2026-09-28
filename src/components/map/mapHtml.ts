import { colors } from '@/theme';

// Página HTML del mapa: MapLibre GL JS + tiles vectoriales de OpenFreeMap
// (datos de OpenStreetMap; gratis, sin API key). Se muestra dentro de un
// WebView en la app y de un iframe en la vista previa web.
//
// MapLibre 5.x porque trae todo en un solo archivo (la 6.x viene en módulos
// separados, más frágil dentro de un WebView). Por ahora se carga desde CDN;
// para el uso offline (fases 7-8) se empaquetará dentro de la app.

const MAPLIBRE_VERSION = '5.24.0';
const CDN = `https://cdn.jsdelivr.net/npm/maplibre-gl@${MAPLIBRE_VERSION}/dist`;
const STYLE_URL = 'https://tiles.openfreemap.org/styles/positron';

export function buildMapHtml(): string {
  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
<link rel="stylesheet" href="${CDN}/maplibre-gl.css" />
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
<script src="${CDN}/maplibre-gl.js"></script>
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
    send({ type: 'error', message: 'No se pudo cargar la librería del mapa (¿sin conexión?)' });
    return;
  }

  var map = new maplibregl.Map({
    container: 'map',
    style: '${STYLE_URL}',
    center: [-74.0308, 4.6948],
    zoom: 15,
    attributionControl: { compact: true },
    pitchWithRotate: false,
    dragRotate: false
  });
  map.touchZoomRotate.disableRotation();

  var loaded = false;
  var pending = null; // último estado recibido antes de que cargue el mapa
  var fitted = false;
  var markers = {}; // id -> { marker, el }
  var userMarker = null;
  var userEl = null;

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

  map.on('load', function () {
    map.addSource('route', { type: 'geojson', data: EMPTY });
    map.addLayer({
      id: 'route', type: 'line', source: 'route',
      layout: { 'line-join': 'round', 'line-cap': 'round' },
      paint: { 'line-color': PRIMARY, 'line-width': 5 }
    });
    map.addSource('accuracy', { type: 'geojson', data: EMPTY });
    map.addLayer({
      id: 'accuracy', type: 'fill', source: 'accuracy',
      paint: { 'fill-color': PRIMARY, 'fill-opacity': 0.1, 'fill-outline-color': PRIMARY }
    });
    loaded = true;
    if (pending) apply(pending);
    send({ type: 'ready' });
  });

  map.on('error', function (e) {
    send({ type: 'error', message: (e && e.error && e.error.message) || 'Error del mapa' });
  });

  // Toques en el mapa (no en un marcador): posición para el modo simulación.
  map.on('click', function (e) {
    var target = e.originalEvent && e.originalEvent.target;
    if (target && target.closest && target.closest('.pin')) return;
    send({ type: 'press', lat: e.lngLat.lat, lng: e.lngLat.lng });
  });

  function apply(state) {
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

    // La primera vez, encuadrar todas las paradas.
    if (!fitted && state.places.length > 0) {
      var bounds = new maplibregl.LngLatBounds();
      state.places.forEach(function (p) { bounds.extend([p.lng, p.lat]); });
      map.fitBounds(bounds, { padding: { top: 80, right: 60, bottom: 160, left: 60 }, maxZoom: 17, duration: 0 });
      fitted = true;
    }
  }

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
