#!/usr/bin/env python3
"""
Servidor HTTP simple para Mi Bot Deriv
Ejecuta: python server.py
Luego abre: http://localhost:8080
"""
import http.server
import socketserver
import os
import sys
import webbrowser
from pathlib import Path

PORT = 8080
DIRECTORY = Path(__file__).parent

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(DIRECTORY), **kwargs)
    
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Deriv-App-ID')
        super().end_headers()
    
    def log_message(self, format, *args):
        print(f"[{self.log_date_time_string()}] {format % args}")

if __name__ == "__main__":
    os.chdir(DIRECTORY)
    print(f"🚀 Iniciando servidor en http://localhost:{PORT}")
    print(f"📁 Sirviendo archivos desde: {DIRECTORY}")
    print("⚠️  Mantén esta ventana abierta mientras uses el bot")
    print("🛑 Presiona Ctrl+C para detener")
    print()
    
    try:
        with socketserver.TCPServer(("", PORT), Handler) as httpd:
            webbrowser.open(f'http://localhost:{PORT}')
            httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n🛑 Servidor detenido")
    except OSError as e:
        if e.errno == 48:  # Address already in use
            print(f"❌ Puerto {PORT} en uso. Cierra otras instancias o cambia el puerto.")
        else:
            print(f"❌ Error: {e}")
        input("Presiona Enter para salir...")