"""Sirve la carpeta content/ en la red local para probar la descarga offline.

Igual que `python -m http.server`, pero con la cabecera CORS que necesita
la página del mapa (dentro de un WebView o iframe) para cargar imágenes
desde este servidor.

Uso:
    python scripts/servir_contenido.py [puerto]   (por defecto 8088)
"""

import sys
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

CONTENT = Path(__file__).resolve().parent.parent / "content"


class CorsHandler(SimpleHTTPRequestHandler):
    def end_headers(self) -> None:
        self.send_header("Access-Control-Allow-Origin", "*")
        super().end_headers()


def main() -> None:
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8088
    handler = partial(CorsHandler, directory=str(CONTENT))
    print(f"Sirviendo {CONTENT} en http://0.0.0.0:{port} (Ctrl+C para detener)")
    ThreadingHTTPServer(("0.0.0.0", port), handler).serve_forever()


if __name__ == "__main__":
    main()
