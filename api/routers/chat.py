import json
import requests
from fastapi import APIRouter, Depends
from api.models import ChatRequest
from api.database import get_vector_connection
from api.routers.config import current_config
from api.routers.auth import get_current_user

router = APIRouter(prefix="/api/chat", tags=["chat"])

OLLAMA_URL = "http://localhost:11434/api"

def get_embedding(text: str) -> list:
    try:
        response = requests.post(
            f"{OLLAMA_URL}/embeddings", 
            json={"model": "nomic-embed-text", "prompt": text},
            timeout=10
        )
        response.raise_for_status()
        return response.json()["embedding"]
    except Exception:
        # Fallback local o dummy
        return [0.0]*768

def search_documents(query_vector: list, top_k=3):
    conn = get_vector_connection()
    cur = conn.cursor()
    try:
        # Formatear el vector a string para PostgreSQL '[0.1, 0.2, ...]'
        vector_str = "[" + ",".join(map(str, query_vector)) + "]"
        
        # Ejecutamos la función busqueda_semantica que creamos en SQL
        cur.execute("SELECT * FROM busqueda_semantica(%s::vector, %s, 0.3)", (vector_str, top_k))
        results = cur.fetchall()
        return results
    except Exception as e:
        print("Error en búsqueda semántica:", e)
        return []
    finally:
        conn.close()

@router.post("/")
async def chat_with_rag(request: ChatRequest, user: dict = Depends(get_current_user)):
    pregunta = request.pregunta
    
    # 1. Generar embedding de la pregunta
    query_vector = get_embedding(pregunta)
    
    # 2. Búsqueda Semántica en pgVector
    contextos = search_documents(query_vector, top_k=3)
    
    contexto_str = ""
    fuentes = []
    for row in contextos:
        contexto_str += f"- Según el {row['tipo_normativa']} '{row['titulo_normativa']}', Documento: {row['nombre_documento']}:\n{row['texto_fragmento']}\n\n"
        fuentes.append(row['nombre_documento'])
        
    if not contexto_str:
        contexto_str = "No se encontró información específica en la base de datos laboral boliviana para responder esto."

    # 3. Construir el prompt para Ollama
    system_prompt = f"""Eres un asistente legal experto en la normativa laboral de Bolivia.
Tu objetivo es responder de manera clara y fundamentada basándote ÚNICAMENTE en la información proporcionada a continuación.
Si la respuesta no está en la información, indica que no tienes datos suficientes en la normativa actual.

INFORMACIÓN DE LA NORMATIVA RECUPERADA:
{contexto_str}
"""
    
    # 4. Generar la respuesta en lenguaje natural usando Ollama
    # Usaremos el modelo especificado en la configuración del Módulo 5.4
    try:
        payload = {
            "model": current_config.model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": pregunta}
            ],
            "stream": False,
            "options": {
                "temperature": current_config.temperature,
                "num_predict": current_config.max_tokens
            }
        }
        res = requests.post(f"{OLLAMA_URL}/chat", json=payload, timeout=30)
        res.raise_for_status()
        respuesta = res.json()["message"]["content"]
    except Exception as e:
        print("Error llamando a Ollama:", e)
        # Fallback si Ollama falla o no tiene el modelo de chat instalado
        respuesta = f"Simulación de respuesta RAG.\nContexto recuperado:\n{contexto_str}"

    return {
        "pregunta": pregunta,
        "respuesta": respuesta,
        "fuentes": list(set(fuentes))
    }
