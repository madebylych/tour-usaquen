"""Sube el contenido de content/ a Supabase: archivos al bucket "media" y
rutas/paradas a las tablas. Se puede ejecutar varias veces: actualiza lo que
ya existe (por slug) en vez de duplicarlo.

Requisitos en .env.local (NO se sube a git):
    EXPO_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
    SUPABASE_SECRET_KEY=sb_secret_...     (Settings > API Keys > Secret keys)

La clave secreta salta todas las reglas de acceso: solo se usa en este
computador y el script nunca la imprime.

Uso:
    py scripts/generar_contenido.py
    python scripts/subir_contenido_supabase.py
"""

import json
import mimetypes
import sys
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CONTENT = ROOT / "content"
BUCKET = "media"

# Columnas de cada tabla (supabase/schema.sql). Lo demás se ignora.
PLACE_COLUMNS = [
    "slug", "name", "category", "latitude", "longitude", "activation_radius", "summary",
    "history", "architecture", "did_you_know", "observation_prompt", "image_path",
    "image_credit", "audio_path", "audio_title", "audio_credit", "sources", "published",
]
ROUTE_COLUMNS = [
    "slug", "name", "description", "duration_min", "distance_m", "cover_image_path",
    "map_image_path", "map_bounds", "version", "published",
]


def read_env() -> dict:
    env = {}
    path = ROOT / ".env.local"
    if path.exists():
        for line in path.read_text(encoding="utf-8").splitlines():
            if "=" in line and not line.lstrip().startswith("#"):
                key, value = line.split("=", 1)
                env[key.strip()] = value.strip()
    return env


def request(method: str, url: str, key: str, body: bytes | None = None, headers: dict | None = None):
    req = urllib.request.Request(url, data=body, method=method)
    req.add_header("apikey", key)
    for name, value in (headers or {}).items():
        req.add_header(name, value)
    try:
        with urllib.request.urlopen(req) as response:
            data = response.read()
            return json.loads(data) if data else None
    except urllib.error.HTTPError as error:
        detail = error.read().decode("utf-8", "replace")[:300]
        sys.exit(f"Error {error.code} en {method} {url.split('?')[0]}: {detail}")


def upload_media(base: str, key: str) -> int:
    files = [p for p in (CONTENT / "media").rglob("*") if p.is_file()]
    for path in files:
        remote = path.relative_to(CONTENT / "media").as_posix()
        mime = mimetypes.guess_type(path.name)[0] or "application/octet-stream"
        url = f"{base}/storage/v1/object/{BUCKET}/{urllib.parse.quote(remote)}"
        request("POST", url, key, path.read_bytes(), {"Content-Type": mime, "x-upsert": "true"})
        print(f"  archivo  {remote}")
    return len(files)


def upsert(base: str, key: str, table: str, rows: list[dict]) -> list[dict]:
    url = f"{base}/rest/v1/{table}?on_conflict=slug"
    headers = {
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates,return=representation",
    }
    return request("POST", url, key, json.dumps(rows).encode("utf-8"), headers)


def upload_route(base: str, key: str, path: Path) -> None:
    data = json.loads(path.read_text(encoding="utf-8"))
    places = upsert(base, key, "places", [{c: p.get(c) for c in PLACE_COLUMNS} for p in data["places"]])
    place_ids = {p["slug"]: p["id"] for p in places}
    route = upsert(base, key, "routes", [{c: data.get(c) for c in ROUTE_COLUMNS}])[0]

    # El orden de las paradas se reemplaza completo.
    request("DELETE", f"{base}/rest/v1/route_places?route_id=eq.{route['id']}", key)
    links = [
        {"route_id": route["id"], "place_id": place_ids[p["slug"]], "position": i + 1}
        for i, p in enumerate(data["places"])
    ]
    request("POST", f"{base}/rest/v1/route_places", key, json.dumps(links).encode("utf-8"),
            {"Content-Type": "application/json"})
    print(f"  ruta     {route['slug']} (versión {route['version']}, {len(links)} paradas)")


def main() -> None:
    env = read_env()
    base = env.get("EXPO_PUBLIC_SUPABASE_URL", "").rstrip("/")
    key = env.get("SUPABASE_SECRET_KEY", "")
    if not base or not key:
        sys.exit("Faltan EXPO_PUBLIC_SUPABASE_URL o SUPABASE_SECRET_KEY en .env.local")
    if not (CONTENT / "routes").exists():
        sys.exit("No hay contenido en content/. Ejecuta primero scripts/generar_contenido.py")

    print(f"Subiendo a {base}")
    count = upload_media(base, key)
    for path in sorted((CONTENT / "routes").glob("*.json")):
        upload_route(base, key, path)
    print(f"Listo: {count} archivos y {len(list((CONTENT / 'routes').glob('*.json')))} ruta(s).")


if __name__ == "__main__":
    main()
