-- ============================================================
--  SEED REAL: Normativa Laboral Bolivia
--  Ejecutar en: rag_legal_db (pgVector, puerto 5432)
--  Uso: psql -h localhost -p 5432 -U rag_user -d rag_legal -f seed_normativa_bolivia.sql
-- ============================================================

-- ============================================================
--  1. NORMATIVAS
-- ============================================================
INSERT INTO normativa (id_normativa, titulo, tipo, fuente, fecha_publicacion) VALUES
  ('11111111-0000-0000-0000-000000000001',
   'Constitución Política del Estado Plurinacional de Bolivia',
   'Constitución', 'Gaceta Oficial del Estado Plurinacional', '2009-02-07'),

  ('11111111-0000-0000-0000-000000000002',
   'Ley General del Trabajo',
   'Ley', 'Gaceta Oficial de Bolivia', '1942-12-08'),

  ('11111111-0000-0000-0000-000000000003',
   'Decreto Supremo N° 224 — Reglamento de la Ley General del Trabajo',
   'Decreto Supremo', 'Gaceta Oficial de Bolivia', '1943-08-23'),

  ('11111111-0000-0000-0000-000000000004',
   'Decreto Ley N° 16187 — Contratos de Trabajo',
   'Decreto Ley', 'Gaceta Oficial de Bolivia', '1979-02-16'),

  ('11111111-0000-0000-0000-000000000005',
   'Decreto Supremo N° 1802 — Segundo Aguinaldo "Esfuerzo por Bolivia"',
   'Decreto Supremo', 'Gaceta Oficial del Estado Plurinacional', '2013-11-20')
ON CONFLICT (id_normativa) DO NOTHING;


-- ============================================================
--  2. DOCUMENTOS LEGALES
-- ============================================================
INSERT INTO documento_legal (id_documento, id_normativa, nombre_documento, url_fuente) VALUES
  ('22222222-0000-0000-0000-000000000001',
   '11111111-0000-0000-0000-000000000001',
   'CPE — Sección III: Derecho al Trabajo y al Empleo (Arts. 46-50)',
   'https://www.oas.org/dil/esp/constitucion_bolivia.pdf'),

  ('22222222-0000-0000-0000-000000000002',
   '11111111-0000-0000-0000-000000000002',
   'Ley General del Trabajo — Beneficios Sociales e Indemnización',
   'https://www.ilo.org/dyn/natlex/natlex4.detail?p_lang=es&p_isn=41888'),

  ('22222222-0000-0000-0000-000000000003',
   '11111111-0000-0000-0000-000000000003',
   'DS 224 — Reglamento: Contratos, Jornada y Causales de Despido',
   'https://lexivox.org/norms/BO-DS-19430823.xhtml'),

  ('22222222-0000-0000-0000-000000000004',
   '11111111-0000-0000-0000-000000000004',
   'DL 16187 — Contratos a Plazo Fijo y Tiempo Indefinido',
   'https://lexivox.org/norms/BO-DL-19790216.xhtml'),

  ('22222222-0000-0000-0000-000000000005',
   '11111111-0000-0000-0000-000000000005',
   'DS 1802 — Segundo Aguinaldo: Condiciones y Alcance',
   'https://lexivox.org/norms/BO-DS-20131120.xhtml')
ON CONFLICT (id_documento) DO NOTHING;


-- ============================================================
--  3. FRAGMENTOS LEGALES (chunks reales de cada norma)
-- ============================================================

-- === CPE — Artículos sobre derechos laborales ===
INSERT INTO fragmento_legal (id_fragmento, id_documento, texto_fragmento, numero_fragmento) VALUES
  ('33333333-0001-0000-0000-000000000001',
   '22222222-0000-0000-0000-000000000001',
   'Artículo 46 CPE — Toda persona tiene derecho al trabajo digno, con seguridad industrial, higiene y salud ocupacional, sin discriminación, y con una remuneración o salario justo, equitativo y satisfactorio, que le asegure para sí y su familia una existencia digna. El Estado protegerá el ejercicio del trabajo en todas sus formas. Se prohíbe toda forma de trabajo forzoso u otro modo análogo de explotación que obligue a una persona a realizar labores sin su consentimiento y justa retribución.',
   1),

  ('33333333-0001-0000-0000-000000000002',
   '22222222-0000-0000-0000-000000000001',
   'Artículo 48 CPE — Las normas laborales se interpretan y aplican bajo los principios de protección de las trabajadoras y de los trabajadores como principal fuerza productiva de la sociedad; de primacía de la relación laboral; de continuidad y estabilidad laboral; de no discriminación y de inversión de la prueba a favor de la trabajadora y del trabajador. Los derechos y beneficios reconocidos en favor de las trabajadoras y los trabajadores no pueden renunciarse, y son nulas las convenciones contrarias o que tiendan a burlar sus efectos. Los salarios o sueldos devengados, derechos laborales, beneficios sociales y aportes a la seguridad social no pagados tienen privilegio y preferencia sobre cualquier otra acreencia, y son inembargables e imprescriptibles.',
   2),

  ('33333333-0001-0000-0000-000000000003',
   '22222222-0000-0000-0000-000000000001',
   'Artículo 48 CPE (continuación) — El Estado garantizará la incorporación de las jóvenes y los jóvenes en el sistema productivo, de acuerdo con su capacitación y formación. Se garantiza la inamovilidad laboral de las mujeres en estado de embarazo, y de los progenitores, hasta que la hija o el hijo cumpla un año de edad. Queda prohibido el despido de la mujer embarazada y del progenitor mientras la hija o el hijo sea menor de un año, salvo probarse que la trabajadora o el trabajador ha incurrido en falta grave conforme a la ley.',
   3),

-- === LGT — Indemnización, Vacaciones, Aguinaldo ===
  ('33333333-0002-0000-0000-000000000001',
   '22222222-0000-0000-0000-000000000002',
   'INDEMNIZACIÓN POR TIEMPO DE SERVICIOS (LGT) — El trabajador que haya prestado servicios durante más de noventa días continuos tiene derecho a recibir una indemnización equivalente a un mes de salario por cada año de trabajo. La indemnización se calcula sobre la base del promedio del total ganado en los últimos tres meses anteriores al retiro. Si el trabajador prestó servicios por una fracción de año, la indemnización se calcula de forma proporcional (en duodécimas) a los meses y días trabajados. El derecho a la indemnización se genera tanto en caso de retiro voluntario como de despido injustificado.',
   1),

  ('33333333-0002-0000-0000-000000000002',
   '22222222-0000-0000-0000-000000000002',
   'DESAHUCIO (LGT) — En caso de despido intempestivo o retiro forzoso sin previo aviso, el empleador debe pagar al trabajador un desahucio equivalente a tres meses de salario. El desahucio no se aplica cuando el trabajador se retira voluntariamente ni cuando el despido es justificado por causales previstas en la ley. El preaviso de retiro debe notificarse con noventa días de anticipación; de no hacerlo, debe pagarse el desahucio en dinero.',
   2),

  ('33333333-0002-0000-0000-000000000003',
   '22222222-0000-0000-0000-000000000002',
   'VACACIONES (LGT) — Todo trabajador que haya cumplido un año de trabajo ininterrumpido tiene derecho a vacaciones pagadas, según la siguiente escala: de 1 a 5 años de antigüedad: 15 días hábiles; de 5 a 10 años: 20 días hábiles; más de 10 años: 30 días hábiles. La vacación es un derecho irrenunciable y no puede compensarse en dinero mientras subsiste la relación laboral. Si la relación laboral termina antes de completar el año, el trabajador tiene derecho al pago proporcional de vacaciones en duodécimas. El cálculo se realiza sobre el salario diario promedio de los últimos tres meses.',
   3),

  ('33333333-0002-0000-0000-000000000004',
   '22222222-0000-0000-0000-000000000002',
   'AGUINALDO DE NAVIDAD (LGT) — Todo trabajador tiene derecho a percibir el aguinaldo de navidad equivalente a un sueldo mensual, pagadero hasta el 25 de diciembre de cada año. Si el trabajador no ha cumplido un año de servicio, el aguinaldo se paga de forma proporcional (en duodécimas) siempre que haya trabajado un mínimo de tres meses. La fórmula para el cálculo proporcional es: (Salario promedio mensual / 12) × Meses trabajados. La base de cálculo es el promedio del total ganado en los últimos tres meses anteriores al pago.',
   4),

  ('33333333-0002-0000-0000-000000000005',
   '22222222-0000-0000-0000-000000000002',
   'FINIQUITO (LGT) — El finiquito es el documento que acredita el pago total de todos los beneficios sociales al finalizar la relación laboral. Debe incluir: indemnización por tiempo de servicios, vacaciones pendientes (proporcionales si corresponde), aguinaldo proporcional, desahucio (si aplica), y cualquier otro beneficio adeudado. El empleador tiene la obligación de emitir el finiquito y efectuar el pago dentro de los quince días siguientes a la conclusión de la relación laboral. El finiquito firmado por ambas partes tiene valor de instrumento público.',
   5),

-- === DS 224 — Reglamento LGT ===
  ('33333333-0003-0000-0000-000000000001',
   '22222222-0000-0000-0000-000000000003',
   'DS 224 — ÁMBITO DE APLICACIÓN — El Decreto Supremo 224 reglamenta la Ley General del Trabajo y se aplica a todos los trabajadores del sector privado que presten servicios bajo dependencia y subordinación. Quedan excluidos inicialmente: los trabajadores agrícolas y ganaderos, los funcionarios públicos regidos por el Estatuto del Funcionario Público, y los miembros activos de las Fuerzas Armadas. Las disposiciones de este reglamento son de orden público y de cumplimiento obligatorio para empleadores y trabajadores.',
   1),

  ('33333333-0003-0000-0000-000000000002',
   '22222222-0000-0000-0000-000000000003',
   'DS 224 — CAUSALES DE DESPIDO JUSTIFICADO — El empleador puede despedir al trabajador sin pago de desahucio ni indemnización en los siguientes casos: perjuicio material intencional en los instrumentos de trabajo; revelación de secretos industriales o comerciales; inasistencia injustificada por más de tres días consecutivos; incumplimiento total de las obligaciones del contrato; condena judicial ejecutoriada que impida el cumplimiento del trabajo; y retiro de bienes de la empresa sin autorización. En todos los casos, el empleador debe notificar por escrito al Ministerio de Trabajo dentro de las 48 horas siguientes al despido.',
   2),

  ('33333333-0003-0000-0000-000000000003',
   '22222222-0000-0000-0000-000000000003',
   'DS 224 — JORNADA LABORAL — La jornada ordinaria de trabajo es de ocho horas diarias y cuarenta y ocho horas semanales para los hombres. Para las mujeres y los menores de edad la jornada es de cuarenta horas semanales. Las horas trabajadas en exceso de la jornada ordinaria constituyen horas extraordinarias y deben pagarse con un recargo del 100% sobre el salario ordinario. El trabajo nocturno (entre las 20:00 y las 06:00 horas) tiene un recargo del 25% sobre el salario diurno.',
   3),

-- === DL 16187 — Contratos ===
  ('33333333-0004-0000-0000-000000000001',
   '22222222-0000-0000-0000-000000000004',
   'DL 16187 — TIPOS DE CONTRATOS DE TRABAJO — El contrato de trabajo puede celebrarse de forma oral o escrita. Los tipos reconocidos son: por tiempo indefinido, a plazo fijo, por temporada, por realización de obra o servicio determinado, condicional y eventual. Si no existe contrato escrito, la ley presume que la relación laboral es por tiempo indefinido, salvo prueba en contrario aportada por el empleador. El contrato a plazo fijo debe consignar expresamente la causa justificada que determina su temporalidad.',
   1),

  ('33333333-0004-0000-0000-000000000002',
   '22222222-0000-0000-0000-000000000004',
   'DL 16187 — PROHIBICIONES EN CONTRATOS A PLAZO FIJO — Está prohibido: (1) Suscribir más de dos contratos sucesivos a plazo fijo con el mismo trabajador. (2) Utilizar contratos a plazo fijo para realizar tareas propias y permanentes de la empresa. En ambos casos, el contrato se convierte automáticamente en un contrato de tiempo indefinido, generando todos los derechos y beneficios correspondientes (indemnización, desahucio, vacaciones, aguinaldo). Esta conversión opera de pleno derecho sin necesidad de declaración judicial.',
   2),

-- === DS 1802 — Doble Aguinaldo ===
  ('33333333-0005-0000-0000-000000000001',
   '22222222-0000-0000-0000-000000000005',
   'DS 1802 — SEGUNDO AGUINALDO "ESFUERZO POR BOLIVIA" — El Decreto Supremo 1802, promulgado el 20 de noviembre de 2013, instituye el pago de un segundo aguinaldo denominado "Esfuerzo por Bolivia" para todos los trabajadores del sector público y privado. Este beneficio adicional equivale a un mes de salario y se paga en cada gestión fiscal únicamente cuando el crecimiento del Producto Interno Bruto (PIB) de Bolivia supera el 4,5% en términos reales. La fecha límite de pago es el 31 de diciembre de cada gestión en que se genere el derecho.',
   1),

  ('33333333-0005-0000-0000-000000000002',
   '22222222-0000-0000-0000-000000000005',
   'DS 1802 — CÁLCULO Y ALCANCE — El segundo aguinaldo aplica a: servidores públicos, trabajadores del sector privado, personal eventual y consultores individuales de línea (según DS 2196 complementario). El monto se calcula de la misma forma que el aguinaldo de navidad: sobre el promedio del total ganado en los últimos tres meses. Para trabajadores que no cumplieron la gestión completa, se calcula de forma proporcional en duodécimas, siempre que hayan trabajado un mínimo de tres meses. El incumplimiento del pago por parte del empleador está sujeto a las multas y sanciones establecidas en el Código Procesal del Trabajo.',
   2)
ON CONFLICT (id_fragmento) DO NOTHING;


-- ============================================================
--  VERIFICACIÓN: Mostrar resumen de lo insertado
-- ============================================================
SELECT
  n.titulo                                AS normativa,
  COUNT(DISTINCT d.id_documento)          AS documentos,
  COUNT(DISTINCT f.id_fragmento)          AS fragmentos
FROM normativa          n
LEFT JOIN documento_legal   d ON d.id_normativa = n.id_normativa
LEFT JOIN fragmento_legal   f ON f.id_documento = d.id_documento
GROUP BY n.id_normativa, n.titulo
ORDER BY n.fecha_publicacion;
