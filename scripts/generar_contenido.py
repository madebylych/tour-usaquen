"""Genera content/ (lo que se sube a Supabase) a partir del contenido real de
la ruta en src/data/local/ruta_usaquen.json, la misma fuente que usa la app
cuando no hay servidor.

Crea:

    content/routes.json                    lista de rutas
    content/routes/usaquen-centro.json     ruta con sus paradas

Borra content/ antes de generarlo para no volver a subir archivos viejos.
Por ahora las paradas no tienen fotos ni audios (image_path y audio_path en
null). Cuando existan, van en content/media/ con la ruta que diga cada parada
(por ejemplo content/media/images/places/plaza-usaquen.jpg).

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
    print(f"Ruta {route['slug']} (versión {route['version']}, {len(places)} paradas) generada en {CONTENT}")


if __name__ == "__main__":
    main()
