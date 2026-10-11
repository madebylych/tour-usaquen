"""Genera las tramas de puntos (semitono de risografía) de la dirección E.

    assets/images/trama.png          fondo azul claro con puntos azules de
                                     tamaño variable (cuando no hay foto)
    assets/images/trama_oscuro.png   lo mismo para el modo oscuro: puntos
                                     azul claro sobre azul noche
    assets/images/trama_overlay.png  trama transparente de 2048x1024 que va
                                     encima de las fotos reales (ya repetida:
                                     resizeMode "repeat" no llenaba la caja en
                                     la web)

Uso:
    py scripts/generar_trama.py
Requiere Pillow (pip install pillow).
"""

import math
from pathlib import Path

from PIL import Image, ImageDraw

OUT = Path(__file__).resolve().parent.parent / "assets" / "images"
BLUE = (29, 91, 214)
BLUE_SOFT = (214, 226, 250)
# Modo oscuro (theme.ts, darkColors): primary y primarySoft.
BLUE_DARK_MODE = (91, 143, 245)
BLUE_SOFT_DARK_MODE = (30, 42, 71)

SCALE = 3  # se dibuja grande y se reduce: puntos con bordes suaves


def trama(width: int, height: int, step: int, ink=BLUE, paper=BLUE_SOFT) -> Image.Image:
    w, h, s = width * SCALE, height * SCALE, step * SCALE
    img = Image.new("RGB", (w, h), paper)
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
            draw.ellipse([x - r, y - r, x + r, y + r], fill=ink)
    return img.resize((width, height), Image.LANCZOS)


def overlay(step: int) -> Image.Image:
    s = step * SCALE
    img = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    r = s * 0.27  # puntos visibles encima de la foto sin taparla
    c = s / 2
    ImageDraw.Draw(img).ellipse([c - r, c - r, c + r, c + r], fill=BLUE + (255,))
    return img.resize((step, step), Image.LANCZOS)


def overlay_sheet(step: int, width: int, height: int) -> Image.Image:
    """El módulo de un punto repetido en una hoja grande."""
    tile = overlay(step)
    sheet = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    for y in range(0, height, step):
        for x in range(0, width, step):
            sheet.paste(tile, (x, y))
    return sheet


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    trama(780, 600, 26).save(OUT / "trama.png", optimize=True)
    trama(780, 600, 26, BLUE_DARK_MODE, BLUE_SOFT_DARK_MODE).save(OUT / "trama_oscuro.png", optimize=True)
    overlay_sheet(16, 2048, 1024).save(OUT / "trama_overlay.png", optimize=True)
    print(f"Tramas generadas en {OUT}")


if __name__ == "__main__":
    main()
