-- =============================================================================
-- VotaFácil — Base de Datos Completa (Español)
-- Versión: 1.0 (Traducción directa de la versión completa)
-- Motor: MySQL 8.0+
-- =============================================================================

CREATE DATABASE IF NOT EXISTS votadb


USE votadb;

-- =============================================================================
-- TABLA: usuarios
-- =============================================================================
CREATE TABLE IF NOT EXISTS usuarios (
    id            INT UNSIGNED     NOT NULL AUTO_INCREMENT,
    nombre_usuario VARCHAR(50)     NOT NULL,
    correo        VARCHAR(150)     NOT NULL,
    clave_hash    VARCHAR(255)     NOT NULL,
    url_avatar    VARCHAR(500)     NULL DEFAULT NULL,
    rol           ENUM('usuario', 'administrador') NOT NULL DEFAULT 'usuario',
    activo        TINYINT(1)       NOT NULL DEFAULT 1,
    creado_en     DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    UNIQUE KEY uq_usuarios_correo (correo),
    UNIQUE KEY uq_usuarios_nombre (nombre_usuario),
    INDEX idx_usuarios_rol        (rol),
    INDEX idx_usuarios_activo     (activo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Usuarios registrados en el sistema';


-- =============================================================================
-- TABLA: salas (Antes: rooms)
-- =============================================================================
CREATE TABLE IF NOT EXISTS salas (
    id            INT UNSIGNED     NOT NULL AUTO_INCREMENT,
    propietario_id INT UNSIGNED    NOT NULL,
    nombre        VARCHAR(150)     NOT NULL,
    descripcion   TEXT             NULL DEFAULT NULL,
    url_imagen    VARCHAR(500)     NULL DEFAULT NULL,
    tipo          ENUM('publica', 'privada') NOT NULL DEFAULT 'publica',
    codigo_acceso VARCHAR(20)      NULL DEFAULT NULL,
    activo        TINYINT(1)       NOT NULL DEFAULT 1,
    creado_en     DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    CONSTRAINT fk_salas_propietario FOREIGN KEY (propietario_id) REFERENCES usuarios(id)
        ON DELETE CASCADE ON UPDATE CASCADE,

    INDEX idx_salas_propietario_id (propietario_id),
    INDEX idx_salas_tipo           (tipo),
    INDEX idx_salas_activo         (activo),
    INDEX idx_salas_codigo_acceso  (codigo_acceso)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Salas de votación públicas y privadas';


-- =============================================================================
-- TABLA: votaciones (Antes: polls)
-- =============================================================================
CREATE TABLE IF NOT EXISTS votaciones (
    id                      INT UNSIGNED     NOT NULL AUTO_INCREMENT,
    sala_id                 INT UNSIGNED     NOT NULL,
    creador_id              INT UNSIGNED     NOT NULL,

    titulo                  VARCHAR(255)     NOT NULL,
    descripcion             TEXT             NULL DEFAULT NULL,

    tipo_voto               ENUM(
                                'seleccion_unica',
                                'seleccion_multiple',
                                'si_no',
                                'calificacion'
                            ) NOT NULL DEFAULT 'seleccion_unica',

    visibilidad             ENUM('secreta', 'publica') NOT NULL DEFAULT 'secreta',
    mostrar_resultados      ENUM('tiempo_real', 'al_finalizar') NOT NULL DEFAULT 'al_finalizar',

    permitir_cambio_voto    TINYINT(1)       NOT NULL DEFAULT 0,
    max_opciones_por_usuario INT UNSIGNED    NOT NULL DEFAULT 1,
    max_participantes       INT UNSIGNED     NULL DEFAULT NULL,

    inicia_en               DATETIME         NULL DEFAULT NULL,
    termina_en              DATETIME         NULL DEFAULT NULL,
    cierre_automatico       TINYINT(1)       NOT NULL DEFAULT 0,

    estado                  ENUM('borrador', 'activa', 'cerrada') NOT NULL DEFAULT 'borrador',

    creado_en               DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en          DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    CONSTRAINT fk_votaciones_sala    FOREIGN KEY (sala_id)    REFERENCES salas(id)    ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_votaciones_creador FOREIGN KEY (creador_id) REFERENCES usuarios(id) ON DELETE CASCADE ON UPDATE CASCADE,

    INDEX idx_votaciones_sala_id    (sala_id),
    INDEX idx_votaciones_creador_id (creador_id),
    INDEX idx_votaciones_estado     (estado),
    INDEX idx_votaciones_inicia_en  (inicia_en),
    INDEX idx_votaciones_termina_en (termina_en)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Votaciones configuradas dentro de cada sala';


-- =============================================================================
-- TABLA: opciones_votacion (Antes: poll_options)
-- =============================================================================
CREATE TABLE IF NOT EXISTS opciones_votacion (
    id            INT UNSIGNED     NOT NULL AUTO_INCREMENT,
    votacion_id   INT UNSIGNED     NOT NULL,
    texto_opcion  VARCHAR(255)     NOT NULL,
    posicion      TINYINT UNSIGNED NOT NULL DEFAULT 0,

    PRIMARY KEY (id),
    CONSTRAINT fk_opciones_votacion_ref FOREIGN KEY (votacion_id) REFERENCES votaciones(id)
        ON DELETE CASCADE ON UPDATE CASCADE,

    INDEX idx_opciones_votacion_ref (votacion_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Opciones de respuesta disponibles en cada votación';


-- =============================================================================
-- TABLA: votos (Antes: votes)
-- =============================================================================
CREATE TABLE IF NOT EXISTS votos (
    id              INT UNSIGNED  NOT NULL AUTO_INCREMENT,
    votacion_id     INT UNSIGNED  NOT NULL,
    opcion_id       INT UNSIGNED  NOT NULL,
    usuario_id      INT UNSIGNED  NOT NULL,
    votado_en       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    CONSTRAINT fk_votos_votacion FOREIGN KEY (votacion_id) REFERENCES votaciones(id)        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_votos_opcion   FOREIGN KEY (opcion_id)   REFERENCES opciones_votacion(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_votos_usuario  FOREIGN KEY (usuario_id)  REFERENCES usuarios(id)          ON DELETE CASCADE ON UPDATE CASCADE,

    UNIQUE KEY uq_votos_usuario_opcion (votacion_id, opcion_id, usuario_id),

    INDEX idx_votos_votacion_id (votacion_id),
    INDEX idx_votos_usuario_id  (usuario_id),
    INDEX idx_votos_opcion_id   (opcion_id),
    INDEX idx_votos_votado_en   (votado_en)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Registro de votos emitidos por cada usuario';


-- =============================================================================
-- TABLA: miembros_sala (Antes: room_members)
-- =============================================================================
CREATE TABLE IF NOT EXISTS miembros_sala (
    id         INT UNSIGNED  NOT NULL AUTO_INCREMENT,
    sala_id    INT UNSIGNED  NOT NULL,
    usuario_id INT UNSIGNED  NOT NULL,
    unido_en   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    CONSTRAINT fk_miembros_sala_ref FOREIGN KEY (sala_id)    REFERENCES salas(id)    ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_miembros_usuario  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE ON UPDATE CASCADE,

    UNIQUE KEY uq_miembros_sala (sala_id, usuario_id),

    INDEX idx_miembros_sala_id (sala_id),
    INDEX idx_miembros_usuario_id (usuario_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Miembros registrados en cada sala';


-- =============================================================================
-- TABLA: participantes_votacion (Antes: poll_participants)
-- =============================================================================
CREATE TABLE IF NOT EXISTS participantes_votacion (
    id               INT UNSIGNED  NOT NULL AUTO_INCREMENT,
    votacion_id      INT UNSIGNED  NOT NULL,
    usuario_id       INT UNSIGNED  NOT NULL,
    participado_en   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    CONSTRAINT fk_participantes_votacion FOREIGN KEY (votacion_id) REFERENCES votaciones(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_participantes_usuario  FOREIGN KEY (usuario_id)  REFERENCES usuarios(id)   ON DELETE CASCADE ON UPDATE CASCADE,

    UNIQUE KEY uq_participantes_votacion (votacion_id, usuario_id),

    INDEX idx_participantes_votacion_id (votacion_id),
    INDEX idx_participantes_usuario_id  (usuario_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Registro de participación única por usuario en cada votación';


-- =============================================================================
-- TABLA: enlaces_compartir (Antes: share_links)
-- =============================================================================
CREATE TABLE IF NOT EXISTS enlaces_compartir (
    id           INT UNSIGNED  NOT NULL AUTO_INCREMENT,
    tipo_entidad ENUM('sala', 'votacion') NOT NULL,
    entidad_id   INT UNSIGNED  NOT NULL,
    token        VARCHAR(100)  NOT NULL,
    expira_en    DATETIME      NULL DEFAULT NULL,
    creado_por   INT UNSIGNED  NOT NULL,
    creado_en    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    CONSTRAINT fk_enlaces_compartir_usuario FOREIGN KEY (creado_por) REFERENCES usuarios(id)
        ON DELETE CASCADE ON UPDATE CASCADE,

    UNIQUE KEY uq_enlaces_compartir_token (token),
    INDEX idx_enlaces_compartir_entidad   (tipo_entidad, entidad_id),
    INDEX idx_enlaces_compartir_creado_por (creado_por)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Tokens únicos para compartir salas y votaciones';


-- =============================================================================
-- TABLA: registro_actividad (Antes: activity_log)
-- =============================================================================
CREATE TABLE IF NOT EXISTS registro_actividad (
    id           INT UNSIGNED  NOT NULL AUTO_INCREMENT,
    usuario_id   INT UNSIGNED  NOT NULL,
    accion       VARCHAR(100)  NOT NULL,
    tipo_entidad VARCHAR(50)   NULL DEFAULT NULL,
    entidad_id   INT UNSIGNED  NULL DEFAULT NULL,
    detalles     JSON          NULL DEFAULT NULL,
    creado_en    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    CONSTRAINT fk_registro_actividad_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
        ON DELETE CASCADE ON UPDATE CASCADE,

    INDEX idx_registro_actividad_usuario_id (usuario_id),
    INDEX idx_registro_actividad_accion     (accion),
    INDEX idx_registro_actividad_entidad    (tipo_entidad, entidad_id),
    INDEX idx_registro_actividad_creado_en  (creado_en)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Registro de actividad e historial de acciones de los usuarios';


-- =============================================================================
-- DATOS INICIALES (Seeds)
-- =============================================================================
INSERT INTO usuarios (nombre_usuario, correo, clave_hash, rol) VALUES
(
    'admin',
    'admin@votafacil.com',
    '$2b$10$KIx7w4w/bH1234567890uABCDEFGHIJKLMNOPQRSTUVWXYZabcde',
    'administrador'
);