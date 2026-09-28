// Copia MapLibre GL JS (JS + CSS) dentro de la app como un módulo de texto,
// para que el mapa funcione sin conexión (no depende de un CDN).
//
// Uso (después de cambiar la versión de maplibre-gl en package.json):
//   node scripts/empaquetar-maplibre.js
//
// Salida: src/components/map/vendor/maplibre.generated.ts (no editar a mano).

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const pkgDir = path.join(root, 'node_modules', 'maplibre-gl');
const { version } = require(path.join(pkgDir, 'package.json'));

const js = fs.readFileSync(path.join(pkgDir, 'dist', 'maplibre-gl.js'), 'utf8');
const css = fs.readFileSync(path.join(pkgDir, 'dist', 'maplibre-gl.css'), 'utf8');
const license = fs.readFileSync(path.join(pkgDir, 'LICENSE.txt'), 'utf8');

// El JS va dentro de una etiqueta <script>: "</script" lo cortaría.
const safe = (text) => text.replace(/<\/(script|style)/gi, '<\\/$1');

const out = `// (excluido del lint en eslint.config.js)
// GENERADO por scripts/empaquetar-maplibre.js. No editar a mano.
//
// MapLibre GL JS ${version}
${license
  .trim()
  .split('\n')
  .map((line) => `// ${line}`.trimEnd())
  .join('\n')}

export const MAPLIBRE_VERSION = ${JSON.stringify(version)};
export const MAPLIBRE_CSS = ${JSON.stringify(safe(css))};
export const MAPLIBRE_JS = ${JSON.stringify(safe(js))};
`;

const target = path.join(root, 'src', 'components', 'map', 'vendor', 'maplibre.generated.ts');
fs.mkdirSync(path.dirname(target), { recursive: true });
fs.writeFileSync(target, out);
console.log(`MapLibre ${version} empaquetado en ${path.relative(root, target)} (${Math.round(out.length / 1024)} KB)`);
