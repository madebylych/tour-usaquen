"""Genera CONTENIDO DE PRUEBA para probar la descarga offline (fase 7).

Crea en content/ la misma estructura que tendrá el servidor real:

    content/routes.json                    lista de rutas
    content/routes/usaquen-centro.json     ruta con sus paradas
    content/media/images/...               imágenes JPG marcadas "IMAGEN DE PRUEBA"
    content/media/audio/...                audios WAV de prueba (tonos, no música)

Nada de esto es contenido real: los nombres, textos y coordenadas son los
mismos datos de prueba de src/data/local/testData.ts.

Uso:
    python scripts/generar_contenido_prueba.py
Para servirlo en la red local (celular y computador en la misma wifi):
    python -m http.server 8088 --directory content

Requiere Pillow (pip install pillow).
"""

import json
import math
import struct
import wave
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent / "content"
PRIMARY = (209, 0, 111)
SOFT = (255, 227, 241)
UPDATED_AT = "2026-09-27T00:00:00Z"

ROUTE = {
    "id": "test-route-1",
    "slug": "usaquen-centro",
    "name": "Ruta de prueba: Usaquén centro",
    "description": "Recorrido de prueba con tres paradas para desarrollar la app.",
    "duration_min": 45,
    "distance_m": 800,
    "cover_image_path": "images/routes/usaquen-centro.jpg",
    "map_image_path": None,
    "map_bounds": None,
    "version": 1,
    "published": True,
    "updated_at": UPDATED_AT,
}

# (número, categoría, latitud, longitud, nota base del audio en Hz)
PLACES = [
    (1, "Galería", 4.6952, -74.0312, 261.63),
    (2, "Música", 4.6945, -74.0300, 329.63),
    (3, "Arquitectura", 4.6938, -74.0315, 392.00),
]


def place_row(n: int, category: str, lat: float, lng: float) -> dict:
    return {
        "id": f"test-place-{n}",
        "slug": f"parada-prueba-{n}",
        "name": f"Parada de prueba {n}",
        "category": category,
        "latitude": lat,
        "longitude": lng,
        "activation_radius": 30,
        "summary": f"Resumen de prueba de la parada {n}.",
        "history": "Texto de prueba. Aquí va la historia del lugar, escrita por el grupo con sus fuentes.",
        "architecture": "Texto de prueba. Aquí va la lectura arquitectónica del lugar.",
        "did_you_know": "Dato curioso de prueba.",
        "observation_prompt": "Consigna de prueba: mira hacia arriba y observa la fachada frente a ti.",
        "image_path": f"images/places/parada-prueba-{n}.jpg",
        "image_credit": "Imagen de prueba generada",
        "audio_path": f"audio/places/parada-prueba-{n}.wav",
        "audio_title": f"Audio de prueba {n}",
        "audio_credit": "Tono de prueba generado",
        "sources": None,
        "published": True,
        "updated_at": UPDATED_AT,
    }


def make_image(path: Path, title: str, subtitle: str) -> None:
    """Degradado fucsia con texto grande. 1200x900, JPG liviano."""
    width, height = 1200, 900
    img = Image.new("RGB", (width, height))
    draw = ImageDraw.Draw(img)
    for y in range(height):
        t = y / height
        color = tuple(int(SOFT[i] * (1 - t) + PRIMARY[i] * t) for i in range(3))
        draw.line([(0, y), (width, y)], fill=color)
    big = ImageFont.load_default(size=110)
    small = ImageFont.load_default(size=44)
    draw.text((width / 2, height / 2 - 40), title, font=big, fill="white", anchor="mm")
    draw.text((width / 2, height / 2 + 70), subtitle, font=small, fill="white", anchor="mm")
    path.parent.mkdir(parents=True, exist_ok=True)
    img.save(path, "JPEG", quality=80)


def make_audio(path: Path, base_hz: float, seconds: float = 12.0) -> None:
    """Acorde suave que pulsa lentamente, con fundido de entrada y salida.
    WAV mono de 22 kHz para que pese poco."""
    rate = 22050
    total = int(rate * seconds)
    freqs = [base_hz, base_hz * 1.25, base_hz * 1.5]  # acorde mayor
    frames = bytearray()
    for i in range(total):
        t = i / rate
        pulse = 0.6 + 0.4 * math.sin(2 * math.pi * 0.25 * t)
        sample = sum(math.sin(2 * math.pi * f * t) for f in freqs) / len(freqs)
        fade = min(t / 1.5, (seconds - t) / 1.5, 1.0)
        value = sample * pulse * fade * 0.3
        frames += struct.pack("<h", int(max(-1.0, min(1.0, value)) * 32767))
    path.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(path), "wb") as wav:
        wav.setnchannels(1)
        wav.setsampwidth(2)
        wav.setframerate(rate)
        wav.writeframes(bytes(frames))


def main() -> None:
    media = ROOT / "media"
    places = []
    for n, category, lat, lng, hz in PLACES:
        row = place_row(n, category, lat, lng)
        places.append(row)
        make_image(media / row["image_path"], f"Parada {n}", "IMAGEN DE PRUEBA")
        make_audio(media / row["audio_path"], hz)
    make_image(media / ROUTE["cover_image_path"], "Usaquén", "IMAGEN DE PRUEBA")

    (ROOT / "routes").mkdir(parents=True, exist_ok=True)
    (ROOT / "routes.json").write_text(json.dumps([ROUTE], ensure_ascii=False, indent=2), encoding="utf-8")
    (ROOT / "routes" / f"{ROUTE['slug']}.json").write_text(
        json.dumps({**ROUTE, "places": places}, ensure_ascii=False, indent=2), encoding="utf-8"
    )

    files = [p for p in ROOT.rglob("*") if p.is_file()]
    size_kb = sum(p.stat().st_size for p in files) / 1024
    print(f"Contenido de prueba generado en {ROOT}: {len(files)} archivos, {size_kb:.0f} KB")


if __name__ == "__main__":
    main()
