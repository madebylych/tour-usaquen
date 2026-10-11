"""Genera el ícono de la app (una U con los colores de la app) en las tres
propuestas, y una hoja para compararlas.

    assets/icono/propuesta_a.png   U amarilla sobre azul, sombra de tinta
    assets/icono/propuesta_b.png   U azul sobre amarillo, sombra de tinta
    assets/icono/propuesta_c.png   U azul sobre blanco con un punto amarillo (una parada)
    assets/icono/comparar.png      las tres juntas, en tamaño de ícono y en pequeño

Y con la elegida (A) genera los íconos que usa la app: assets/icon.png,
favicon.png, android-icon-{foreground,background,monochrome}.png y
splash-icon.png.

Uso:
    py scripts/generar_icono.py
Requiere Pillow. La letra es Bricolage Grotesque ExtraBold (la de los títulos).
"""

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "assets" / "icono"
FONT = ROOT / "node_modules/@expo-google-fonts/bricolage-grotesque/800ExtraBold/BricolageGrotesque_800ExtraBold.ttf"

BLUE = (29, 91, 214)
YELLOW = (255, 216, 61)
INK = (21, 21, 26)
WHITE = (255, 255, 255)

SIZE = 1024


def draw_u(img: Image.Image, color, shadow, size_ratio=0.78, offset=0.035, center_y=0.5):
    """U centrada; `shadow` es la segunda tinta desplazada abajo a la derecha."""
    draw = ImageDraw.Draw(img)
    font = ImageFont.truetype(str(FONT), int(SIZE * size_ratio))
    left, top, right, bottom = draw.textbbox((0, 0), "U", font=font)
    x = (SIZE - (right - left)) / 2 - left
    y = SIZE * center_y - (bottom - top) / 2 - top
    d = SIZE * offset
    if shadow:
        draw.text((x + d, y + d), "U", font=font, fill=shadow)
    draw.text((x, y), "U", font=font, fill=color)
    return (x + left, y + top, x + right, y + bottom)


def propuesta_a() -> Image.Image:
    img = Image.new("RGB", (SIZE, SIZE), BLUE)
    draw_u(img, YELLOW, INK)
    return img


def propuesta_b() -> Image.Image:
    img = Image.new("RGB", (SIZE, SIZE), YELLOW)
    draw_u(img, BLUE, INK)
    return img


def propuesta_c() -> Image.Image:
    img = Image.new("RGB", (SIZE, SIZE), WHITE)
    l, t, r, b = draw_u(img, BLUE, None, center_y=0.47)
    # Un punto amarillo dentro de la U: la parada que se descubre.
    draw = ImageDraw.Draw(img)
    cx, cy, rad = SIZE / 2, t + (b - t) * 0.36, SIZE * 0.085
    draw.ellipse([cx - rad, cy - rad, cx + rad, cy + rad], fill=YELLOW, outline=INK, width=int(SIZE * 0.018))
    return img


def comparar(icons: dict[str, Image.Image]) -> Image.Image:
    """Cada propuesta en grande (con esquinas redondeadas, como en el celular) y en pequeño."""
    pad, big, small = 40, 300, 72
    sheet = Image.new("RGB", (pad + len(icons) * (big + pad), big + small + pad * 4), (236, 236, 236))
    draw = ImageDraw.Draw(sheet)
    label = ImageFont.truetype(str(FONT), 34)
    for i, (name, icon) in enumerate(icons.items()):
        x = pad + i * (big + pad)
        mask = Image.new("L", (big, big), 0)
        ImageDraw.Draw(mask).rounded_rectangle([0, 0, big, big], radius=big * 0.22, fill=255)
        sheet.paste(icon.resize((big, big), Image.LANCZOS), (x, pad), mask)
        mask_s = Image.new("L", (small, small), 0)
        ImageDraw.Draw(mask_s).rounded_rectangle([0, 0, small, small], radius=small * 0.22, fill=255)
        sheet.paste(icon.resize((small, small), Image.LANCZOS), (x, big + pad * 2), mask_s)
        draw.text((x + small + 20, big + pad * 2 + 16), name, font=label, fill=INK)
    return sheet


def capa_u(color, shadow, size_ratio) -> Image.Image:
    """U sola sobre fondo transparente (capas del ícono adaptable y splash)."""
    img = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    draw_u(img, color, shadow, size_ratio=size_ratio)
    return img


def iconos_finales() -> None:
    """Ícono elegido: propuesta A (Emily, 2026-10-10)."""
    assets = ROOT / "assets"
    icon = propuesta_a()
    icon.save(assets / "icon.png")
    icon.resize((48, 48), Image.LANCZOS).save(assets / "favicon.png")
    # Android adaptable: cada celular recorta con su forma (círculo, gota...)
    # y solo garantiza el centro (~66%), por eso la U va más pequeña.
    capa_u(YELLOW, INK, 0.5).save(assets / "android-icon-foreground.png")
    Image.new("RGB", (SIZE, SIZE), BLUE).save(assets / "android-icon-background.png")
    capa_u(WHITE, None, 0.5).save(assets / "android-icon-monochrome.png")  # íconos temáticos (Android 13+)
    capa_u(YELLOW, INK, 0.62).save(assets / "splash-icon.png")


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    icons = {"A": propuesta_a(), "B": propuesta_b(), "C": propuesta_c()}
    for name, icon in icons.items():
        icon.save(OUT / f"propuesta_{name.lower()}.png")
    comparar(icons).save(OUT / "comparar.png")
    iconos_finales()
    print(f"Propuestas en {OUT}; ícono A instalado en assets/")


if __name__ == "__main__":
    main()
