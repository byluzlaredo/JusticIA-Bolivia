# -*- coding: utf-8 -*-
"""
Script para generar Embeddings usando OLLAMA localmente.
Cumple con el Módulo 5.3: "Generación de representaciones semánticas"

Uso:
    pip install requests psycopg2-binary
    python scripts/process_embeddings.py

Asegúrate de que Ollama esté corriendo y tengas el modelo descargado:
    ollama pull nomic-embed-text
"""

import os
import uuid
import requests
import psycopg2

# ── Configuración de la Base de Datos ─────────────────────────────────────────
DB_CONFIG = {
    "host":     os.getenv("PGVECTOR_HOST", "localhost"),
    "port":     int(os.getenv("PGVECTOR_PORT", 5432)),
    "dbname":   os.getenv("PGVECTOR_DB",   "rag_legal"),
    "user":     os.getenv("PGVECTOR_USER", "rag_user"),
    "password": os.getenv("PGVECTOR_PASSWORD", "rag_password_2024"),
}

# ── Configuración de Ollama ───────────────────────────────────────────────────
OLLAMA_URL = "http://localhost:11434/api/embeddings"
MODEL_NAME = "nomic-embed-text" # Cambia esto si usas mxbai-embed-large o llama3
VECTOR_DIMENSION = 768          # nomic-embed-text produce 768 dimensiones

def get_ollama_embedding(text: str) -> list:
    """Obtiene el embedding de Ollama llamando a su API REST."""
    payload = {
        "model": MODEL_NAME,
        "prompt": text
    }
    response = requests.post(OLLAMA_URL, json=payload)
    response.raise_for_status()
    return response.json()["embedding"]

def main():
    print(f"\n🧠 Iniciando generación de Embeddings con OLLAMA (Modelo: {MODEL_NAME})...")
    
    # 1. Conectar a la base de datos
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        conn.autocommit = False
        cur = conn.cursor()
    except Exception as e:
        print(f"❌ Error al conectar a la BD: {e}")
        return

    # Ajustamos la dimensión del vector en la BD para Ollama (768 para nomic-embed-text)
    print(f"⚙️  Ajustando dimensión de vectores en la base de datos a {VECTOR_DIMENSION}...")
    cur.execute(f"ALTER TABLE embedding ALTER COLUMN vector TYPE vector({VECTOR_DIMENSION});")
    conn.commit()

    # 2. Buscar fragmentos que aún no tengan embedding
    cur.execute("""
        SELECT f.id_fragmento, f.texto_fragmento 
        FROM fragmento_legal f
        LEFT JOIN embedding e ON f.id_fragmento = e.id_fragmento
        WHERE e.id_embedding IS NULL
    """)
    fragmentos = cur.fetchall()

    if not fragmentos:
        print("✅ Todos los fragmentos ya tienen sus representaciones semánticas (embeddings).")
        cur.close()
        conn.close()
        return

    print(f"🔍 Encontrados {len(fragmentos)} fragmentos pendientes. Generando vectores con Ollama...")

    # 3. Generar embeddings con Ollama y guardar
    total_procesados = 0
    for id_frag, texto in fragmentos:
        try:
            # Obtener vector desde Ollama local
            vector = get_ollama_embedding(texto)
            
            # Guardar en pgVector
            id_embedding = str(uuid.uuid4())
            cur.execute("""
                INSERT INTO embedding (id_embedding, id_fragmento, vector, modelo)
                VALUES (%s, %s, %s, %s)
            """, (id_embedding, id_frag, vector, MODEL_NAME))
            
            total_procesados += 1
            if total_procesados % 5 == 0:
                print(f"  ... {total_procesados} embeddings generados.")
                
        except Exception as e:
            print(f"⚠ Error al procesar el fragmento {id_frag}: {e}")
            print("¿Aseguraste que Ollama está corriendo y el modelo está descargado?")
            break

    conn.commit()
    cur.close()
    conn.close()

    print(f"\n🚀 ¡Éxito! Se generaron y almacenaron {total_procesados} embeddings con Ollama.")
    print("📚 La base de conocimiento jurídica está lista para búsquedas semánticas (RAG).")

if __name__ == "__main__":
    main()
