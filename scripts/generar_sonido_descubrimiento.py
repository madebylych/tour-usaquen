"""Genera el sonido PROVISIONAL de descubrimiento de parada.

Dos notas ascendentes con ataque corto y caída tipo campana. Es un
marcador de posición hasta que el equipo de música entregue el sonido
definitivo: basta con reemplazar el archivo de salida (mismo nombre).

Uso:
    python scripts/generar_sonido_descubrimiento.py

Salida: assets/sounds/ui/discovery.wav (WAV mono, 16 bits, 44.1 kHz).
Solo usa la biblioteca estándar de Python.
"""

import math
import struct
import wave
from pathlib import Path

SAMPLE_RATE = 44100
OUTPUT = Path(__file__).resolve().parent.parent / "assets" / "sounds" / "ui" / "discovery.wav"

# (frecuencia en Hz, inicio en segundos, duración en segundos)
NOTES = [
    (659.25, 0.00, 0.55),  # Mi5
    (987.77, 0.12, 0.80),  # Si5
]
TOTAL_SECONDS = 0.95
VOLUME = 0.35


def bell(freq: float, t: float, duration: float) -> float:
    """Una nota con un armónico suave, ataque de 5 ms y caída exponencial."""
    if t < 0 or t > duration:
        return 0.0
    attack = min(t / 0.005, 1.0)
    decay = math.exp(-5.0 * t / duration)
    tone = math.sin(2 * math.pi * freq * t) + 0.3 * math.sin(2 * math.pi * freq * 2 * t)
    return tone * attack * decay


def main() -> None:
    frames = bytearray()
    total = int(SAMPLE_RATE * TOTAL_SECONDS)
    for i in range(total):
        t = i / SAMPLE_RATE
        sample = sum(bell(freq, t - start, dur) for freq, start, dur in NOTES)
        # Fundido final de 20 ms para evitar un clic al cortar.
        fade = min((total - i) / (SAMPLE_RATE * 0.02), 1.0)
        value = max(-1.0, min(1.0, sample * VOLUME * fade))
        frames += struct.pack("<h", int(value * 32767))

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(OUTPUT), "wb") as wav:
        wav.setnchannels(1)
        wav.setsampwidth(2)
        wav.setframerate(SAMPLE_RATE)
        wav.writeframes(bytes(frames))

    print(f"Sonido generado: {OUTPUT} ({len(frames) / 1024:.0f} KB, {TOTAL_SECONDS} s)")


if __name__ == "__main__":
    main()
