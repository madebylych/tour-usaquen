"""Genera content/ (lo que se sube a Supabase) a partir del contenido real de
la ruta en src/data/local/ruta_usaquen.json, la misma fuente que usa la app
cuando no hay servidor.

Crea:

    content/routes.json                    lista de rutas
    content/routes/usaquen-centro.json     ruta con sus paradas

Borra content/ antes de generarlo para no volver a subir archivos viejos.
Los archivos (fotos, audios) viven en media/ con la misma ruta que dice cada
parada (por ejemplo media/images/places/plaza-usaquen.jpg) y se copian a
content/media/. Solo se copian los que el JSON usa.

Uso:
    py scripts/generar_contenido.py
    py scripts/subir_contenido_supabase.py
"""

import json
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "src" / "data" / "local" / "ruta_usaquen.json"
CONTENT = ROOT / "content"
MEDIA = ROOT / "media"


def main() -> None:
    data = json.loads(SOURCE.read_text(encoding="utf-8"))
    route, places = data["route"], data["places"]

    if CONTENT.exists():
        shutil.rmtree(CONTENT)
    (CONTENT / "routes").mkdir(parents=True)
    (CONTENT / "routes.json").write_text(json.dumps([route], ensure_ascii=False, indent=2), encoding="utf-8")
    (CONTENT / "routes" / f"{route['slug']}.json").write_text(
        json.dumps({**route, "places": places}, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    used = [route.get("cover_image_path"), route.get("map_image_path")]
    used += [p.get(k) for p in places for k in ("image_path", "audio_path")]
    for path in filter(None, used):
        source = MEDIA / path
        if not source.exists():
            raise SystemExit(f"Falta el archivo {source}")
        target = CONTENT / "media" / path
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(source, target)
    print(f"Ruta {route['slug']} (versión {route['version']}, {len(places)} paradas) generada en {CONTENT}")


if __name__ == "__main__":
    main()
