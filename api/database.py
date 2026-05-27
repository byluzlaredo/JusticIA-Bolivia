import os
import psycopg2
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv

load_dotenv()

# Configuración de base de datos Laboral (Usuarios, Consultas, Cálculos)
LABORAL_DB_CONFIG = {
    "host":     os.getenv("LABORAL_HOST", "localhost"),
    "port":     int(os.getenv("LABORAL_PORT", 5433)), 
    "dbname":   os.getenv("LABORAL_DB",   "sistema_laboral"),
    "user":     os.getenv("LABORAL_USER", "laboral_user"),
    "password": os.getenv("LABORAL_PASSWORD", "laboral_password_2024"),
}

# Configuración de base de datos Vector (Normativas, RAG)
VECTOR_DB_CONFIG = {
    "host":     os.getenv("PGVECTOR_HOST", "localhost"),
    "port":     int(os.getenv("PGVECTOR_PORT", 5432)),
    "dbname":   os.getenv("PGVECTOR_DB",   "rag_legal"),
    "user":     os.getenv("PGVECTOR_USER", "rag_user"),
    "password": os.getenv("PGVECTOR_PASSWORD", "rag_password_2024"),
}

def get_laboral_connection():
    return psycopg2.connect(**LABORAL_DB_CONFIG, cursor_factory=RealDictCursor)

def get_vector_connection():
    return psycopg2.connect(**VECTOR_DB_CONFIG, cursor_factory=RealDictCursor)
