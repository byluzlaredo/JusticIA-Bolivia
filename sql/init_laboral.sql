-- ============================================================
--  Sistema Laboral - PostgreSQL estándar (sin pgVector)
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


-- ============================================================
-- TABLA: usuario
-- ============================================================
CREATE TABLE IF NOT EXISTS usuario (
    id_usuario      SERIAL      PRIMARY KEY,
    nombre          VARCHAR(100) NOT NULL,
    apellido        VARCHAR(100) NOT NULL,
    correo          VARCHAR(255) NOT NULL UNIQUE,
    contrasena      TEXT        NOT NULL,            -- Almacenar hash (bcrypt/argon2)
    rol             VARCHAR(50) NOT NULL DEFAULT 'usuario', -- usuario, admin, supervisor
    fecha_registro  DATE        NOT NULL DEFAULT CURRENT_DATE,
    activo          BOOLEAN     NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_usuario_correo ON usuario(correo);
CREATE INDEX IF NOT EXISTS idx_usuario_rol    ON usuario(rol);


-- ============================================================
-- TABLA: sesion
-- ============================================================
CREATE TABLE IF NOT EXISTS sesion (
    id_sesion       SERIAL      PRIMARY KEY,
    id_usuario      INT         NOT NULL REFERENCES usuario(id_usuario) ON DELETE CASCADE,
    fecha_inicio    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    fecha_fin       TIMESTAMPTZ,
    estado          VARCHAR(20) NOT NULL DEFAULT 'activa' CHECK (estado IN ('activa', 'cerrada', 'expirada'))
);

CREATE INDEX IF NOT EXISTS idx_sesion_usuario ON sesion(id_usuario);
CREATE INDEX IF NOT EXISTS idx_sesion_estado  ON sesion(estado);


-- ============================================================
-- TABLA: consulta
-- ============================================================
CREATE TABLE IF NOT EXISTS consulta (
    id_consulta     SERIAL      PRIMARY KEY,
    id_usuario      INT         NOT NULL REFERENCES usuario(id_usuario) ON DELETE CASCADE,
    pregunta        TEXT        NOT NULL,
    fecha_consulta  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    tipo_consulta   VARCHAR(50)          -- laboral, normativa, calculo, general
);

CREATE INDEX IF NOT EXISTS idx_consulta_usuario ON consulta(id_usuario);
CREATE INDEX IF NOT EXISTS idx_consulta_fecha   ON consulta(fecha_consulta);


-- ============================================================
-- TABLA: respuesta
-- ============================================================
CREATE TABLE IF NOT EXISTS respuesta (
    id_respuesta    SERIAL      PRIMARY KEY,
    id_consulta     INT         NOT NULL UNIQUE REFERENCES consulta(id_consulta) ON DELETE CASCADE,
    contenido       TEXT        NOT NULL,
    referencias     TEXT,                            -- JSON o texto con fuentes citadas
    fecha_respuesta TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_respuesta_consulta ON respuesta(id_consulta);


-- ============================================================
-- TABLA: documento_laboral
-- ============================================================
CREATE TABLE IF NOT EXISTS documento_laboral (
    id_documento        SERIAL      PRIMARY KEY,
    id_usuario          INT         NOT NULL REFERENCES usuario(id_usuario) ON DELETE CASCADE,
    tipo_documento      VARCHAR(100) NOT NULL,       -- liquidacion, contrato, carta, certificado
    contenido           TEXT        NOT NULL,
    fecha_generacion    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_doc_usuario ON documento_laboral(id_usuario);
CREATE INDEX IF NOT EXISTS idx_doc_tipo    ON documento_laboral(tipo_documento);


-- ============================================================
-- TABLA: calculo_laboral
-- ============================================================
CREATE TABLE IF NOT EXISTS calculo_laboral (
    id_calculo      SERIAL      PRIMARY KEY,
    id_usuario      INT         NOT NULL REFERENCES usuario(id_usuario) ON DELETE CASCADE,
    tipo_calculo    VARCHAR(100) NOT NULL,           -- liquidacion, aguinaldo, vacacion, iue
    resultado       NUMERIC(15, 2) NOT NULL,
    detalle         JSONB,                           -- Desglose del cálculo (salario, dias, etc.)
    fecha_calculo   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_calculo_usuario ON calculo_laboral(id_usuario);
CREATE INDEX IF NOT EXISTS idx_calculo_tipo    ON calculo_laboral(tipo_calculo);


-- ============================================================
-- VISTA: historial_usuario
-- ============================================================
CREATE OR REPLACE VIEW historial_usuario AS
SELECT
    u.id_usuario,
    u.nombre || ' ' || u.apellido  AS nombre_completo,
    u.correo,
    u.rol,
    COUNT(DISTINCT c.id_consulta)  AS total_consultas,
    COUNT(DISTINCT d.id_documento) AS total_documentos,
    COUNT(DISTINCT cl.id_calculo)  AS total_calculos,
    MAX(s.fecha_inicio)            AS ultima_sesion
FROM usuario          u
LEFT JOIN consulta    c  ON c.id_usuario  = u.id_usuario
LEFT JOIN documento_laboral d ON d.id_usuario = u.id_usuario
LEFT JOIN calculo_laboral   cl ON cl.id_usuario = u.id_usuario
LEFT JOIN sesion      s  ON s.id_usuario  = u.id_usuario
GROUP BY u.id_usuario, u.nombre, u.apellido, u.correo, u.rol;


COMMENT ON TABLE usuario           IS 'Usuarios del sistema (trabajadores, RRHH, admins)';
COMMENT ON TABLE sesion            IS 'Registro de sesiones de acceso';
COMMENT ON TABLE consulta          IS 'Preguntas realizadas por el usuario al asistente';
COMMENT ON TABLE respuesta         IS 'Respuesta generada para cada consulta (1:1)';
COMMENT ON TABLE documento_laboral IS 'Documentos laborales generados (contratos, liquidaciones)';
COMMENT ON TABLE calculo_laboral   IS 'Cálculos laborales: liquidaciones, aguinaldos, vacaciones';
