-- ============================================================
--  RAG Legal Database - pgVector Schema
--  Basado en el diagrama de clases del sistema normativo
-- ============================================================

-- Habilitar la extension de vectores
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pg_trgm;  -- Para búsqueda de texto completo


-- ============================================================
-- TABLA: normativa
-- Representa la entidad raíz del sistema legal
-- ============================================================
CREATE TABLE IF NOT EXISTS normativa (
    id_normativa    UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    titulo          TEXT        NOT NULL,
    tipo            VARCHAR(100) NOT NULL,          -- Ley, Decreto, Reglamento, etc.
    fuente          VARCHAR(255),                    -- Gaceta Oficial, Entidad emisora
    fecha_publicacion DATE,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_normativa_tipo   ON normativa(tipo);
CREATE INDEX IF NOT EXISTS idx_normativa_fecha  ON normativa(fecha_publicacion);
CREATE INDEX IF NOT EXISTS idx_normativa_titulo ON normativa USING gin(to_tsvector('spanish', titulo));


-- ============================================================
-- TABLA: documento_legal
-- Documentos concretos asociados a una normativa
-- ============================================================
CREATE TABLE IF NOT EXISTS documento_legal (
    id_documento    UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_normativa    UUID        NOT NULL REFERENCES normativa(id_normativa) ON DELETE CASCADE,
    nombre_documento TEXT       NOT NULL,
    contenido       TEXT,                            -- Texto completo extraído (OCR / parsing)
    url_fuente      TEXT,                            -- URL o ruta al archivo original
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_documento_normativa ON documento_legal(id_normativa);
CREATE INDEX IF NOT EXISTS idx_documento_nombre    ON documento_legal USING gin(to_tsvector('spanish', nombre_documento));


-- ============================================================
-- TABLA: fragmento_legal
-- Chunks del documento divididos para el proceso de RAG
-- ============================================================
CREATE TABLE IF NOT EXISTS fragmento_legal (
    id_fragmento    UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_documento    UUID        NOT NULL REFERENCES documento_legal(id_documento) ON DELETE CASCADE,
    texto_fragmento TEXT        NOT NULL,
    numero_fragmento INT        NOT NULL,            -- Orden del fragmento en el documento
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fragmento_documento ON fragmento_legal(id_documento);
CREATE INDEX IF NOT EXISTS idx_fragmento_numero    ON fragmento_legal(id_documento, numero_fragmento);
CREATE INDEX IF NOT EXISTS idx_fragmento_texto     ON fragmento_legal USING gin(to_tsvector('spanish', texto_fragmento));


-- ============================================================
-- TABLA: embedding
-- Vectores generados por el modelo de embeddings (1536 = OpenAI)
-- Ajusta la dimensión según tu modelo:
--   384  → sentence-transformers/all-MiniLM-L6-v2
--   768  → multilingual-e5-base
--   1536 → text-embedding-ada-002 (OpenAI)
--   3072 → text-embedding-3-large (OpenAI)
-- ============================================================
CREATE TABLE IF NOT EXISTS embedding (
    id_embedding    UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_fragmento    UUID        NOT NULL UNIQUE REFERENCES fragmento_legal(id_fragmento) ON DELETE CASCADE,
    vector          vector(1536) NOT NULL,           -- <-- Cambia la dimensión si usas otro modelo
    modelo          VARCHAR(100) DEFAULT 'text-embedding-ada-002',
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Índice HNSW para búsqueda semántica ultrarrápida (recomendado para producción)
CREATE INDEX IF NOT EXISTS idx_embedding_hnsw
    ON embedding USING hnsw (vector vector_cosine_ops)
    WITH (m = 16, ef_construction = 64);

-- Alternativa IVFFlat (mejor para datasets muy grandes, requiere VACUUM)
-- CREATE INDEX IF NOT EXISTS idx_embedding_ivfflat
--     ON embedding USING ivfflat (vector vector_cosine_ops)
--     WITH (lists = 100);


-- ============================================================
-- TABLA: consulta_usuario
-- Consultas realizadas por el usuario al sistema RAG
-- ============================================================
CREATE TABLE IF NOT EXISTS consulta_usuario (
    id_consulta     UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    pregunta        TEXT        NOT NULL,
    vector_consulta vector(1536),                    -- Vector de la pregunta (para análisis)
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_consulta_fecha ON consulta_usuario(created_at);


-- ============================================================
-- TABLA: resultado_busqueda
-- Resultados recuperados para cada consulta (similitud semántica)
-- ============================================================
CREATE TABLE IF NOT EXISTS resultado_busqueda (
    id_resultado        UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_consulta         UUID        NOT NULL REFERENCES consulta_usuario(id_consulta) ON DELETE CASCADE,
    id_fragmento        UUID        NOT NULL REFERENCES fragmento_legal(id_fragmento),
    similitud           FLOAT       NOT NULL CHECK (similitud >= 0 AND similitud <= 1),
    contenido_recuperado TEXT       NOT NULL,         -- Snapshot del texto al momento de la consulta
    rank_posicion       INT,                          -- Posición en el ranking de resultados
    created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_resultado_consulta  ON resultado_busqueda(id_consulta);
CREATE INDEX IF NOT EXISTS idx_resultado_similitud ON resultado_busqueda(similitud DESC);
CREATE INDEX IF NOT EXISTS idx_resultado_fragmento ON resultado_busqueda(id_fragmento);


-- ============================================================
-- FUNCIÓN: busqueda_semantica
-- Realiza búsqueda por similitud coseno con pgVector
-- Uso: SELECT * FROM busqueda_semantica('[0.1, 0.2, ...]'::vector, 5, 0.7);
-- ============================================================
CREATE OR REPLACE FUNCTION busqueda_semantica(
    query_vector    vector(1536),
    top_k           INT     DEFAULT 5,
    umbral_similitud FLOAT  DEFAULT 0.5
)
RETURNS TABLE (
    id_fragmento        UUID,
    id_documento        UUID,
    texto_fragmento     TEXT,
    numero_fragmento    INT,
    similitud           FLOAT,
    nombre_documento    TEXT,
    titulo_normativa    TEXT,
    tipo_normativa      VARCHAR(100)
)
LANGUAGE SQL STABLE AS $$
    SELECT
        f.id_fragmento,
        f.id_documento,
        f.texto_fragmento,
        f.numero_fragmento,
        (1 - (e.vector <=> query_vector))::FLOAT AS similitud,
        d.nombre_documento,
        n.titulo            AS titulo_normativa,
        n.tipo              AS tipo_normativa
    FROM embedding          e
    JOIN fragmento_legal    f ON f.id_fragmento = e.id_fragmento
    JOIN documento_legal    d ON d.id_documento  = f.id_documento
    JOIN normativa          n ON n.id_normativa  = d.id_normativa
    WHERE (1 - (e.vector <=> query_vector)) >= umbral_similitud
    ORDER BY e.vector <=> query_vector   -- distancia coseno ascendente = mayor similitud
    LIMIT top_k;
$$;


-- ============================================================
-- FUNCIÓN: trigger updated_at automático
-- ============================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_normativa_updated_at
    BEFORE UPDATE ON normativa
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE OR REPLACE TRIGGER trg_documento_updated_at
    BEFORE UPDATE ON documento_legal
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- ============================================================
-- VISTA: vista_fragmentos_completa
-- Vista enriquecida para consultas frecuentes
-- ============================================================
CREATE OR REPLACE VIEW vista_fragmentos_completa AS
SELECT
    f.id_fragmento,
    f.texto_fragmento,
    f.numero_fragmento,
    d.id_documento,
    d.nombre_documento,
    d.url_fuente,
    n.id_normativa,
    n.titulo            AS titulo_normativa,
    n.tipo              AS tipo_normativa,
    n.fuente            AS fuente_normativa,
    n.fecha_publicacion,
    CASE WHEN e.id_embedding IS NOT NULL THEN TRUE ELSE FALSE END AS tiene_embedding
FROM fragmento_legal    f
JOIN documento_legal    d ON d.id_documento = f.id_documento
JOIN normativa          n ON n.id_normativa = d.id_normativa
LEFT JOIN embedding     e ON e.id_fragmento = f.id_fragmento;


COMMENT ON TABLE normativa           IS 'Entidad raíz: leyes, decretos y reglamentos del sistema legal';
COMMENT ON TABLE documento_legal     IS 'Documentos PDF/texto asociados a cada normativa';
COMMENT ON TABLE fragmento_legal     IS 'Chunks de texto generados para el proceso RAG';
COMMENT ON TABLE embedding           IS 'Vectores semánticos generados por el modelo de embeddings';
COMMENT ON TABLE consulta_usuario    IS 'Historial de preguntas realizadas al sistema RAG';
COMMENT ON TABLE resultado_busqueda  IS 'Resultados recuperados por similitud para cada consulta';
