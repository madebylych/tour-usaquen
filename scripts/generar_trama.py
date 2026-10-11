"""Genera la trama de puntos (semitono de risografía) que se ve cuando una
parada o ruta no tiene foto.

    assets/images/trama.png   puntos negros de tamaño variable sobre fondo
                              transparente. La app la pinta con el color
                              principal elegido (tintColor) sobre su versión
                              suave, así sirve para todas las paletas y para
                              el modo oscuro.

Uso:
    py scripts/generar_trama.py
Requiere Pillow (pip install pillow).
"""

import math
from pathlib import Path

from PIL import Image, ImageDraw

OUT = Path(__file__).resolve().parent.parent / "assets" / "images"

SCALE = 3  # se dibuja grande y se reduce: puntos con bordes suaves


def trama(width: int, height: int, step: int) -> Image.Image:
    w, h, s = width * SCALE, height * SCALE, step * SCALE
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    for row in range(h // s + 2):
        for col in range(w // s + 2):
            x, y = col * s, row * s
            u, v = x / w, y / h
            # Ondas suaves: zonas de puntos grandes y zonas de puntos finos,
            # como una foto tramada.
            tone = 0.5 + 0.28 * math.sin(u * 5.2 + 0.6) + 0.22 * math.cos(v * 4.1 + u * 2.3)
            tone = min(1.0, max(0.12, tone))
            r = tone * s * 0.36
            draw.ellipse([x - r, y - r, x + r, y + r], fill=(0, 0, 0, 255))
    return img.resize((width, height), Image.LANCZOS)


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    trama(780, 600, 26).save(OUT / "trama.png", optimize=True)
    print(f"Trama generada en {OUT}")


if __name__ == "__main__":
    main()
