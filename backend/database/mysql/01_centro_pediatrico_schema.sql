-- =====================================================================
-- Centro Médico Pediátrico (MySQL / InnoDB)
-- Esquema relacional normalizado para atención pediátrica
-- =====================================================================

-- Desactivar temporalmente revisión de llaves foráneas para recreación segura
SET FOREIGN_KEY_CHECKS = 0;

-- Eliminar tablas viejas en inglés si existen en la base
DROP TABLE IF EXISTS antecedent;
DROP TABLE IF EXISTS attendent;
DROP TABLE IF EXISTS diagnosis;
DROP TABLE IF EXISTS doctor;
DROP TABLE IF EXISTS growth_monitoring;
DROP TABLE IF EXISTS invoice_detail;
DROP TABLE IF EXISTS invoice;
DROP TABLE IF EXISTS medical_consultation;
DROP TABLE IF EXISTS patient;
DROP TABLE IF EXISTS payment_detail;
DROP TABLE IF EXISTS payment;
DROP TABLE IF EXISTS recipe_detail;
DROP TABLE IF EXISTS recipe;
DROP TABLE IF EXISTS prescription;
DROP TABLE IF EXISTS treatment;
DROP TABLE IF EXISTS vaccination_record;
DROP TABLE IF EXISTS vaccination;

-- Eliminar tablas en español si ya existían
DROP TABLE IF EXISTS detallepago;
DROP TABLE IF EXISTS pago;
DROP TABLE IF EXISTS detallefactura;
DROP TABLE IF EXISTS factura;
DROP TABLE IF EXISTS registrovacunacion;
DROP TABLE IF EXISTS vacuna;
DROP TABLE IF EXISTS controlcrecimiento;
DROP TABLE IF EXISTS antecedente;
DROP TABLE IF EXISTS detallereceta;
DROP TABLE IF EXISTS receta;
DROP TABLE IF EXISTS medicamento;
DROP TABLE IF EXISTS tratamiento;
DROP TABLE IF EXISTS diagnostico;
DROP TABLE IF EXISTS consulta;
DROP TABLE IF EXISTS usuario;
DROP TABLE IF EXISTS paciente;
DROP TABLE IF EXISTS medico;
DROP TABLE IF EXISTS encargado;

SET FOREIGN_KEY_CHECKS = 1;

-- -----------------------------------------------------
-- 1. Encargado (Padre, madre o tutor legal del menor)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS encargado (
    id_encargado INT AUTO_INCREMENT PRIMARY KEY,
    nombres VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    parentesco VARCHAR(30) NOT NULL,
    telefono VARCHAR(15) NOT NULL,
    direccion VARCHAR(200),
    correo VARCHAR(100),
    dpi VARCHAR(13) UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- 2. Médico (Pediatras del centro)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS medico (
    id_medico INT AUTO_INCREMENT PRIMARY KEY,
    nombres VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    colegiado VARCHAR(20) NOT NULL UNIQUE,
    telefono VARCHAR(8),
    correo VARCHAR(100)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- 3. Usuario (Autenticación @pediatria)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS usuario (
    id_usuario INT AUTO_INCREMENT PRIMARY KEY,
    usuario VARCHAR(50) NOT NULL UNIQUE,
    nombre VARCHAR(150) NOT NULL,
    rol VARCHAR(20) NOT NULL,
    password_hash VARCHAR(100) NOT NULL,
    id_medico INT UNIQUE,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT chk_usuario_rol CHECK (rol IN ('medico', 'secretaria')),
    CONSTRAINT fk_usuario_medico FOREIGN KEY (id_medico) REFERENCES medico(id_medico) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- 4. Paciente (Infante / menor de edad)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS paciente (
    id_paciente INT AUTO_INCREMENT PRIMARY KEY,
    nombres VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    fecha_nacimiento DATE NOT NULL,
    sexo CHAR(1) NOT NULL,
    id_encargado INT NOT NULL,
    dpi VARCHAR(13) UNIQUE,
    direccion VARCHAR(200),
    telefono VARCHAR(15),
    correo VARCHAR(100),
    tipo_sangre VARCHAR(5),
    fecha_registro DATE NOT NULL DEFAULT (CURRENT_DATE),
    estado VARCHAR(20) NOT NULL DEFAULT 'activo',
    motivo_baja VARCHAR(200),
    fecha_baja DATE,
    CONSTRAINT chk_paciente_sexo CHECK (sexo IN ('M', 'F')),
    CONSTRAINT chk_paciente_estado CHECK (estado IN ('activo', 'archivado')),
    CONSTRAINT fk_paciente_encargado FOREIGN KEY (id_encargado) REFERENCES encargado(id_encargado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- 5. Consulta (Atención pediátrica)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS consulta (
    id_consulta INT AUTO_INCREMENT PRIMARY KEY,
    id_paciente INT NOT NULL,
    id_medico INT NOT NULL,
    motivo VARCHAR(200) NOT NULL,
    notas TEXT,
    fecha_consulta DATE NOT NULL DEFAULT (CURRENT_DATE),
    CONSTRAINT fk_consulta_paciente FOREIGN KEY (id_paciente) REFERENCES paciente(id_paciente),
    CONSTRAINT fk_consulta_medico FOREIGN KEY (id_medico) REFERENCES medico(id_medico)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- 6. Diagnóstico
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS diagnostico (
    id_diagnostico INT AUTO_INCREMENT PRIMARY KEY,
    id_consulta INT NOT NULL,
    nombre VARCHAR(150) NOT NULL,
    codigo_cie10 VARCHAR(10),
    descripcion TEXT,
    tipo VARCHAR(20) NOT NULL DEFAULT 'presuntivo',
    fecha DATE NOT NULL DEFAULT (CURRENT_DATE),
    CONSTRAINT chk_diag_tipo CHECK (tipo IN ('presuntivo', 'definitivo')),
    CONSTRAINT fk_diagnostico_consulta FOREIGN KEY (id_consulta) REFERENCES consulta(id_consulta) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- 7. Tratamiento
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS tratamiento (
    id_tratamiento INT AUTO_INCREMENT PRIMARY KEY,
    id_diagnostico INT NOT NULL,
    descripcion TEXT NOT NULL,
    duracion INT,
    fecha_inicio DATE,
    fecha_fin DATE,
    CONSTRAINT fk_tratamiento_diagnostico FOREIGN KEY (id_diagnostico) REFERENCES diagnostico(id_diagnostico) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- 8. Medicamento (Catálogo pediátrico)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS medicamento (
    id_medicamento INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(120) NOT NULL,
    presentacion VARCHAR(50),
    concentracion VARCHAR(30),
    UNIQUE KEY uq_medicamento (nombre, presentacion, concentracion)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- 9. Receta
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS receta (
    id_receta INT AUTO_INCREMENT PRIMARY KEY,
    id_consulta INT NOT NULL,
    codigo VARCHAR(20) NOT NULL UNIQUE,
    fecha DATE NOT NULL DEFAULT (CURRENT_DATE),
    CONSTRAINT fk_receta_consulta FOREIGN KEY (id_consulta) REFERENCES consulta(id_consulta) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- 10. DetalleReceta
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS detallereceta (
    id_detalle INT AUTO_INCREMENT PRIMARY KEY,
    id_receta INT NOT NULL,
    id_medicamento INT NOT NULL,
    dosis VARCHAR(50) NOT NULL,
    via_administracion VARCHAR(30),
    frecuencia VARCHAR(50),
    indicaciones TEXT,
    duracion INT,
    CONSTRAINT fk_detalle_receta FOREIGN KEY (id_receta) REFERENCES receta(id_receta) ON DELETE CASCADE,
    CONSTRAINT fk_detalle_medicamento FOREIGN KEY (id_medicamento) REFERENCES medicamento(id_medicamento)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- 11. Antecedente (Alergias, cirugías, patologías)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS antecedente (
    id_antecedente INT AUTO_INCREMENT PRIMARY KEY,
    id_paciente INT NOT NULL,
    tipo VARCHAR(40) NOT NULL,
    descripcion TEXT,
    fecha DATE NOT NULL DEFAULT (CURRENT_DATE),
    CONSTRAINT fk_antecedente_paciente FOREIGN KEY (id_paciente) REFERENCES paciente(id_paciente) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- 12. ControlCrecimiento (Antropometría y percentiles)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS controlcrecimiento (
    id_control INT AUTO_INCREMENT PRIMARY KEY,
    id_paciente INT NOT NULL,
    fecha DATE NOT NULL DEFAULT (CURRENT_DATE),
    peso DECIMAL(5,2),
    talla DECIMAL(5,2),
    perimetro_cefalico DECIMAL(5,2),
    edad_meses INT NOT NULL,
    observaciones TEXT,
    CONSTRAINT fk_control_paciente FOREIGN KEY (id_paciente) REFERENCES paciente(id_paciente) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- 13. Vacuna (Catálogo del esquema de vacunación)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS vacuna (
    id_vacuna INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    enfermedad_previene VARCHAR(150),
    dosis_requeridas INT NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- 14. RegistroVacunacion (Dosis aplicadas y seguimiento)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS registrovacunacion (
    id_registro INT AUTO_INCREMENT PRIMARY KEY,
    id_paciente INT NOT NULL,
    id_vacuna INT NOT NULL,
    numero_dosis INT NOT NULL,
    fecha_aplicacion DATE NOT NULL DEFAULT (CURRENT_DATE),
    proxima_fecha DATE,
    lote VARCHAR(50),
    id_medico INT,
    observaciones TEXT,
    CONSTRAINT fk_regvac_paciente FOREIGN KEY (id_paciente) REFERENCES paciente(id_paciente) ON DELETE CASCADE,
    CONSTRAINT fk_regvac_vacuna FOREIGN KEY (id_vacuna) REFERENCES vacuna(id_vacuna),
    CONSTRAINT fk_regvac_medico FOREIGN KEY (id_medico) REFERENCES medico(id_medico) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- 15. Factura (Facturación de la atención)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS factura (
    id_factura INT AUTO_INCREMENT PRIMARY KEY,
    id_consulta INT NOT NULL,
    fecha DATE NOT NULL DEFAULT (CURRENT_DATE),
    total DECIMAL(10,2) NOT NULL,
    estado VARCHAR(20) NOT NULL DEFAULT 'pendiente',
    CONSTRAINT chk_factura_estado CHECK (estado IN ('pendiente', 'pagada', 'anulada')),
    CONSTRAINT fk_factura_consulta FOREIGN KEY (id_consulta) REFERENCES consulta(id_consulta)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- 16. DetalleFactura
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS detallefactura (
    id_detalle_factura INT AUTO_INCREMENT PRIMARY KEY,
    id_factura INT NOT NULL,
    concepto VARCHAR(150) NOT NULL,
    cantidad INT NOT NULL,
    precio_unitario DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    CONSTRAINT fk_detfactura_factura FOREIGN KEY (id_factura) REFERENCES factura(id_factura) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- 17. Pago
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS pago (
    id_pago INT AUTO_INCREMENT PRIMARY KEY,
    id_factura INT NOT NULL,
    fecha_pago DATE NOT NULL DEFAULT (CURRENT_DATE),
    monto_total DECIMAL(10,2) NOT NULL,
    CONSTRAINT fk_pago_factura FOREIGN KEY (id_factura) REFERENCES factura(id_factura)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- 18. DetallePago
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS detallepago (
    id_detalle_pago INT AUTO_INCREMENT PRIMARY KEY,
    id_pago INT NOT NULL,
    metodo_pago VARCHAR(30) NOT NULL,
    monto DECIMAL(10,2) NOT NULL,
    CONSTRAINT chk_detpago_metodo CHECK (metodo_pago IN ('efectivo', 'tarjeta', 'transferencia')),
    CONSTRAINT fk_detpago_pago FOREIGN KEY (id_pago) REFERENCES pago(id_pago) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Índices para optimización de lectura frecuente (Sección 5.4.1)
-- -----------------------------------------------------
CREATE INDEX idx_paciente_encargado ON paciente(id_encargado);
CREATE INDEX idx_paciente_nombres ON paciente(apellidos, nombres);
CREATE INDEX idx_consulta_paciente ON consulta(id_paciente);
CREATE INDEX idx_control_paciente ON controlcrecimiento(id_paciente, fecha);
CREATE INDEX idx_regvac_paciente ON registrovacunacion(id_paciente);
CREATE INDEX idx_receta_consulta ON receta(id_consulta);

