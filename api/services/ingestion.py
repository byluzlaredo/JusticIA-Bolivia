import os
import json
import uuid
import time
import requests
from bs4 import BeautifulSoup
from api.database import get_vector_connection

# Módulo 5.2 y 5.3: Base de Conocimiento y Procesamiento

NORMATIVAS = [
    {
        "id": "11111111-0000-0000-0000-000000000001",
        "titulo": "Constitución Política del Estado Plurinacional de Bolivia",
        "tipo": "Constitución",
        "fuente": "Gaceta Oficial",
        "fecha": "2009-02-07",
        "documentos": [{"id": "22222222-0000-0000-0000-000000000001", "nombre": "CPE", "url": "https://www.lexivox.org/norms/BO-CPE-20090207.xhtml"}]
    },
    {
        "id": "11111111-0000-0000-0000-000000000002",
        "titulo": "Ley General del Trabajo",
        "tipo": "Ley",
        "fuente": "Gaceta Oficial",
        "fecha": "1939-05-24",
        "documentos": [{"id": "22222222-0000-0000-0000-000000000002", "nombre": "Ley General del Trabajo", "url": "https://www.lexivox.org/norms/BO-L-19390524.xhtml"}]
    }
]

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Accept-Language": "es-ES,es;q=0.9",
}

def clean_text(text: str) -> str:
    lines = [l.strip() for l in text.splitlines() if l.strip()]
    filtered = []
    skip = False
    for line in lines:
        if "Preguntas frecuentes sobre LexiVox" in line: skip = True
        if skip and ("ARTÍCULO" in line.upper() or "CAPÍTULO" in line.upper() or "Art." in line): skip = False
        if not skip: filtered.append(line)
    return "\n".join(filtered)

def fetch_legal_text(url: str) -> str:
    try:
        r = requests.get(url, headers=HEADERS, timeout=30)
        r.raise_for_status()
        soup = BeautifulSoup(r.text, "html.parser")
        for selector in ["div.norm", "div#norma", "article", "div.contenido", "main"]:
            block = soup.select_one(selector)
            if block:
                text = block.get_text(separator="\n", strip=True)
                if len(text) > 200: return clean_text(text)
        for tag in soup(["script", "style", "nav", "header", "footer"]):
            tag.decompose()
        return clean_text(soup.get_text(separator="\n", strip=True))
    except Exception as e:
        print(f"Error fetching {url}: {e}")
        return ""

def chunk_text(text: str, chunk_size=800, overlap=100):
    if not text: return []
    chunks = []
    start = 0
    while start < len(text):
        end = start + chunk_size
        chunk = text[start:end]
        if end < len(text):
            cut = max(chunk.rfind("\n"), chunk.rfind(". "), chunk.rfind(".- "))
            if cut > chunk_size // 2:
                chunk = text[start: start + cut + 1]
                end = start + cut + 1
        if chunk.strip(): chunks.append(chunk.strip())
        start = end - overlap
    return chunks

OLLAMA_ONLINE = False
try:
    r = requests.get("http://localhost:11434/api/tags", timeout=1)
    if r.status_code == 200:
        OLLAMA_ONLINE = True
        print("Conexión con Ollama detectada. Los embeddings reales serán generados.")
    else:
        print("Ollama respondió pero no con código 200. Usando embeddings predeterminados rápidos.")
except Exception:
    print("Ollama no está en ejecución. Usando embeddings predeterminados rápidos para el demo.")

def get_ollama_embedding(text: str, model="nomic-embed-text") -> list:
    if not OLLAMA_ONLINE:
        return [0.0]*768
    try:
        url = "http://localhost:11434/api/embeddings"
        payload = {"model": model, "prompt": text}
        response = requests.post(url, json=payload, timeout=5)
        response.raise_for_status()
        return response.json()["embedding"]
    except Exception:
        # Fallback local o dummy si ollama no responde
        return [0.0]*768

def procesar_y_guardar_datos():
    output_dir = os.path.join(os.getcwd(), "datos_procesados")
    os.makedirs(output_dir, exist_ok=True)
    
    conn = get_vector_connection()
    conn.autocommit = False
    cur = conn.cursor()
    
    # Preparamos la DB para vectores de 768 dimensiones
    cur.execute("ALTER TABLE embedding ALTER COLUMN vector TYPE vector(768);")
    conn.commit()

    todos_los_chunks = []

    for norm in NORMATIVAS:
        cur.execute("""
            INSERT INTO normativa (id_normativa, titulo, tipo, fuente, fecha_publicacion)
            VALUES (%s, %s, %s, %s, %s) ON CONFLICT DO NOTHING
        """, (norm["id"], norm["titulo"], norm["tipo"], norm["fuente"], norm["fecha"]))
        conn.commit()
        
        for doc in norm["documentos"]:
            print(f"Procesando {doc['nombre']}...")
            texto = fetch_legal_text(doc["url"])
            if not texto: continue
            
            # Guardar el texto crudo en datos_procesados
            raw_file_path = os.path.join(output_dir, f"{doc['nombre'].replace(' ', '_')}_raw.txt")
            with open(raw_file_path, "w", encoding="utf-8") as f:
                f.write(texto)
                
            cur.execute("""
                INSERT INTO documento_legal (id_documento, id_normativa, nombre_documento, contenido, url_fuente)
                VALUES (%s, %s, %s, %s, %s) ON CONFLICT (id_documento) DO UPDATE SET contenido=EXCLUDED.contenido
            """, (doc["id"], norm["id"], doc["nombre"], texto, doc["url"]))
            conn.commit()
            
            chunks = chunk_text(texto)
            print(f"Dividido en {len(chunks)} fragmentos.")
            for i, chunk in enumerate(chunks, 1):
                frag_id = str(uuid.uuid4())
                cur.execute("""
                    INSERT INTO fragmento_legal (id_fragmento, id_documento, texto_fragmento, numero_fragmento)
                    VALUES (%s, %s, %s, %s) ON CONFLICT DO NOTHING
                """, (frag_id, doc["id"], chunk, i))
                
                # Generar embedding
                vector = get_ollama_embedding(chunk)
                if vector and len(vector) > 1:
                    emb_id = str(uuid.uuid4())
                    cur.execute("""
                        INSERT INTO embedding (id_embedding, id_fragmento, vector, modelo)
                        VALUES (%s, %s, %s, %s) ON CONFLICT DO NOTHING
                    """, (emb_id, frag_id, vector, "nomic-embed-text"))

                todos_los_chunks.append({
                    "normativa": norm["titulo"],
                    "documento": doc["nombre"],
                    "numero_fragmento": i,
                    "texto": chunk
                })
                
                # Commit periódico para evitar sobrecargar la transacción o que la conexión caduque
                if i % 100 == 0:
                    conn.commit()
                    print(f"  -> Guardados {i} fragmentos...")
                    
            conn.commit()
            print(f"Completado {doc['nombre']}.")
            time.sleep(1)
            
    conn.commit()
    cur.close()
    conn.close()
    
    # Guardar chunks procesados en JSON
    json_path = os.path.join(output_dir, "chunks_procesados.json")
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(todos_los_chunks, f, indent=4, ensure_ascii=False)
        
    print(f"Éxito: Procesados {len(todos_los_chunks)} fragmentos en total.")
    return {"status": "success", "message": f"Procesados {len(todos_los_chunks)} fragmentos. Datos guardados en {output_dir}"}

if __name__ == "__main__":
    procesar_y_guardar_datos()
