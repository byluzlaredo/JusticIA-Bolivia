# -*- coding: utf-8 -*-
"""
Script para descargar la normativa laboral boliviana desde LexiVox
y cargarla directamente en la base pgVector (rag_legal).

Uso:
    pip install requests beautifulsoup4 psycopg2-binary
    python scripts/load_normativa.py
"""

import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8", errors="replace")

import os
import re
import uuid
import time
import requests
import psycopg2
from bs4 import BeautifulSoup

# ── Conexión a la base de datos ──────────────────────────────────────────────
DB_CONFIG = {
    "host":     os.getenv("PGVECTOR_HOST", "localhost"),
    "port":     int(os.getenv("PGVECTOR_PORT", 5432)),
    "dbname":   os.getenv("PGVECTOR_DB",   "rag_legal"),
    "user":     os.getenv("PGVECTOR_USER", "rag_user"),
    "password": os.getenv("PGVECTOR_PASSWORD", "rag_password_2024"),
}

# ── Normativas a descargar ────────────────────────────────────────────────────
NORMATIVAS = [
    {
        "id":        "11111111-0000-0000-0000-000000000001",
        "titulo":    "Constitución Política del Estado Plurinacional de Bolivia",
        "tipo":      "Constitución",
        "fuente":    "Gaceta Oficial del Estado Plurinacional",
        "fecha":     "2009-02-07",
        "documentos": [
            {
                "id":     "22222222-0000-0000-0000-000000000001",
                "nombre": "CPE — Sección III: Derecho al Trabajo (Arts. 46-50)",
                "url":    "https://lexivox.org/norms/BO-CPE-20090207.xhtml",
            }
        ]
    },
    {
        "id":        "11111111-0000-0000-0000-000000000002",
        "titulo":    "Ley General del Trabajo",
        "tipo":      "Ley",
        "fuente":    "Gaceta Oficial de Bolivia",
        "fecha":     "1942-12-08",
        "documentos": [
            {
                "id":     "22222222-0000-0000-0000-000000000002",
                "nombre": "Ley General del Trabajo — Texto Completo",
                "url":    "https://lexivox.org/norms/BO-L-19420608.xhtml",
            }
        ]
    },
    {
        "id":        "11111111-0000-0000-0000-000000000003",
        "titulo":    "Decreto Supremo N° 224 — Reglamento de la Ley General del Trabajo",
        "tipo":      "Decreto Supremo",
        "fuente":    "Gaceta Oficial de Bolivia",
        "fecha":     "1943-08-23",
        "documentos": [
            {
                "id":     "22222222-0000-0000-0000-000000000003",
                "nombre": "DS 224 — Reglamento LGT Texto Completo",
                "url":    "https://lexivox.org/norms/BO-DS-19430823.xhtml",
            }
        ]
    },
    {
        "id":        "11111111-0000-0000-0000-000000000004",
        "titulo":    "Decreto Ley N° 16187 — Contratos de Trabajo",
        "tipo":      "Decreto Ley",
        "fuente":    "Gaceta Oficial de Bolivia",
        "fecha":     "1979-02-16",
        "documentos": [
            {
                "id":     "22222222-0000-0000-0000-000000000004",
                "nombre": "DL 16187 — Contratos Texto Completo",
                "url":    "https://lexivox.org/norms/BO-DL-19790216.xhtml",
            }
        ]
    },
    {
        "id":        "11111111-0000-0000-0000-000000000005",
        "titulo":    "Decreto Supremo N° 1802 — Segundo Aguinaldo \"Esfuerzo por Bolivia\"",
        "tipo":      "Decreto Supremo",
        "fuente":    "Gaceta Oficial del Estado Plurinacional",
        "fecha":     "2013-11-20",
        "documentos": [
            {
                "id":     "22222222-0000-0000-0000-000000000005",
                "nombre": "DS 1802 — Segundo Aguinaldo Texto Completo",
                "url":    "https://lexivox.org/norms/BO-DS-20131120.xhtml",
            }
        ]
    },
]

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                  "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Accept-Language": "es-ES,es;q=0.9",
}

CHUNK_SIZE = 800   # caracteres por fragmento
OVERLAP    = 100   # solapamiento entre fragmentos


def fetch_legal_text(url: str) -> str:
    """Descarga una página de LexiVox y extrae el texto legal."""
    print(f"  ↓ Descargando {url}")
    try:
        r = requests.get(url, headers=HEADERS, timeout=30)
        r.raise_for_status()
        soup = BeautifulSoup(r.text, "html.parser")

        # LexiVox pone el texto legal en <div class="norm"> o <div id="norma">
        # Intentar múltiples selectores
        for selector in ["div.norm", "div#norma", "article", "div.contenido", "main"]:
            block = soup.select_one(selector)
            if block:
                text = block.get_text(separator="\n", strip=True)
                if len(text) > 200:
                    return clean_text(text)

        # Fallback: todo el body sin scripts/styles
        for tag in soup(["script", "style", "nav", "header", "footer"]):
            tag.decompose()
        text = soup.get_text(separator="\n", strip=True)
        return clean_text(text)

    except Exception as e:
        print(f"  ⚠ Error al descargar {url}: {e}")
        return ""


def clean_text(text: str) -> str:
    """Limpia el texto descargado."""
    lines = [l.strip() for l in text.splitlines() if l.strip()]
    # Quitar la sección FAQ de LexiVox si aparece
    filtered = []
    skip = False
    for line in lines:
        if "Preguntas frecuentes sobre LexiVox" in line:
            skip = True
        if skip and ("ARTÍCULO" in line.upper() or "CAPÍTULO" in line.upper() or
                     "Art." in line or "Artículo" in line):
            skip = False
        if not skip:
            filtered.append(line)
    return "\n".join(filtered)


def chunk_text(text: str, chunk_size: int = CHUNK_SIZE, overlap: int = OVERLAP):
    """Divide el texto en fragmentos con solapamiento."""
    if not text:
        return []
    chunks = []
    start  = 0
    while start < len(text):
        end = start + chunk_size
        chunk = text[start:end]
        # Intentar cortar en punto/salto de línea para no partir palabras
        if end < len(text):
            cut = max(chunk.rfind("\n"), chunk.rfind(". "), chunk.rfind(".- "))
            if cut > chunk_size // 2:
                chunk = text[start: start + cut + 1]
                end   = start + cut + 1
        if chunk.strip():
            chunks.append(chunk.strip())
        start = end - overlap
    return chunks


def insert_normativa(cur, n: dict):
    cur.execute("""
        INSERT INTO normativa (id_normativa, titulo, tipo, fuente, fecha_publicacion)
        VALUES (%s, %s, %s, %s, %s)
        ON CONFLICT (id_normativa) DO UPDATE
          SET titulo = EXCLUDED.titulo,
              tipo   = EXCLUDED.tipo,
              fuente = EXCLUDED.fuente
    """, (n["id"], n["titulo"], n["tipo"], n["fuente"], n["fecha"]))


def insert_documento(cur, doc: dict, id_normativa: str, contenido: str):
    cur.execute("""
        INSERT INTO documento_legal (id_documento, id_normativa, nombre_documento, contenido, url_fuente)
        VALUES (%s, %s, %s, %s, %s)
        ON CONFLICT (id_documento) DO UPDATE
          SET contenido = EXCLUDED.contenido
    """, (doc["id"], id_normativa, doc["nombre"], contenido, doc["url"]))


def insert_fragmento(cur, id_doc: str, texto: str, numero: int) -> str:
    frag_id = str(uuid.uuid4())
    cur.execute("""
        INSERT INTO fragmento_legal (id_fragmento, id_documento, texto_fragmento, numero_fragmento)
        VALUES (%s, %s, %s, %s)
        ON CONFLICT DO NOTHING
    """, (frag_id, id_doc, texto, numero))
    return frag_id


def main():
    print("\n🚀 Cargando normativa laboral boliviana en pgVector...\n")
    conn = psycopg2.connect(**DB_CONFIG)
    conn.autocommit = False
    cur  = conn.cursor()

    total_fragmentos = 0

    for norm in NORMATIVAS:
        print(f"\n📋 Procesando: {norm['titulo']}")
        insert_normativa(cur, norm)

        for doc in norm["documentos"]:
            texto_completo = fetch_legal_text(doc["url"])
            time.sleep(1.5)  # respetar rate limit de LexiVox

            if not texto_completo:
                print(f"  ⚠ Sin contenido para {doc['nombre']} — saltando")
                insert_documento(cur, doc, norm["id"], "")
                continue

            print(f"  ✓ Texto descargado: {len(texto_completo):,} caracteres")
            insert_documento(cur, doc, norm["id"], texto_completo)

            chunks = chunk_text(texto_completo)
            print(f"  ✓ Fragmentos generados: {len(chunks)}")

            for i, chunk in enumerate(chunks, start=1):
                insert_fragmento(cur, doc["id"], chunk, i)
                total_fragmentos += 1

    conn.commit()
    cur.close()
    conn.close()

    print(f"\n✅ Carga completada.")
    print(f"   Normativas : {len(NORMATIVAS)}")
    print(f"   Fragmentos : {total_fragmentos}")
    print("\n⚡ Siguiente paso: generar embeddings con tu modelo y actualizar")
    print("   la tabla 'embedding' con los vectores de cada fragmento.\n")


if __name__ == "__main__":
    main()
