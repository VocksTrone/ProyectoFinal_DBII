-- =====================================================================
-- Datos de prueba del Centro Médico Pediátrico (MySQL)
-- Contraseña de todos los usuarios de prueba: Pediatria2026!
-- Hash bcrypt generado: $2b$10$63HEtiYs4cls4N3yVqplhO3wH9EgPhiN7vTfMWtquxb5GKO/X1WHu
-- =====================================================================

-- 1. Encargados / Padres o Tutores
INSERT INTO encargado (id_encargado, nombres, apellidos, parentesco, telefono, direccion, correo, dpi) VALUES
(1, 'Carlos Eduardo', 'Morales Rivera', 'Padre', '55112233', '4ta Calle 12-30 Zona 3, Quetzaltenango', 'carlos.morales@mail.com', '2345678900101'),
(2, 'Elena María', 'Castillo de Morales', 'Madre', '55443322', '4ta Calle 12-30 Zona 3, Quetzaltenango', 'elena.castillo@mail.com', '2345678910101'),
(3, 'Roberto Alonzo', 'Gómez Méndez', 'Padre', '44556677', 'Barrio San Bartolo, Salcajá, Quetzaltenango', 'roberto.gomez@mail.com', '1987654320901'),
(4, 'Patricia', 'Gómez Mendoza', 'Tía / Tutora legal', '44889900', 'Sector Los Altos, La Esperanza, Quetzaltenango', 'patricia.gomez@mail.com', '3012345670901');

-- 2. Médicos Pediatras
INSERT INTO medico (id_medico, nombres, apellidos, colegiado, telefono, correo) VALUES
(1, 'Gabriel', 'Choc Alvarado', 'COL-08451', '50123456', 'gchoc@pediatria.gt'),
(2, 'Sofía', 'Estrada Méndez', 'COL-09312', '50987654', 'sestrada@pediatria.gt');

-- 3. Usuarios del sistema (@pediatria)
INSERT INTO usuario (id_usuario, usuario, nombre, rol, password_hash, id_medico, activo) VALUES
(1, 'gchoc', 'Dr. Gabriel Choc', 'medico', '$2b$10$63HEtiYs4cls4N3yVqplhO3wH9EgPhiN7vTfMWtquxb5GKO/X1WHu', 1, TRUE),
(2, 'sestrada', 'Dra. Sofía Estrada', 'medico', '$2b$10$63HEtiYs4cls4N3yVqplhO3wH9EgPhiN7vTfMWtquxb5GKO/X1WHu', 2, TRUE),
(3, 'sperez', 'Silvia Pérez', 'secretaria', '$2b$10$63HEtiYs4cls4N3yVqplhO3wH9EgPhiN7vTfMWtquxb5GKO/X1WHu', NULL, TRUE);

-- 4. Pacientes Pediátricos
INSERT INTO paciente (id_paciente, nombres, apellidos, fecha_nacimiento, sexo, id_encargado, dpi, direccion, telefono, correo, tipo_sangre, fecha_registro, estado) VALUES
(1, 'Mateo Sebastián', 'Morales Castillo', '2024-05-15', 'M', 1, '3512345670901', '4ta Calle 12-30 Zona 3, Quetzaltenango', '55112233', 'carlos.morales@mail.com', 'O+', '2024-05-18', 'activo'),
(2, 'Lucía Valentina', 'Morales Castillo', '2022-09-10', 'F', 2, '3412345670901', '4ta Calle 12-30 Zona 3, Quetzaltenango', '55443322', 'elena.castillo@mail.com', 'O+', '2022-09-15', 'activo'),
(3, 'Dylan Alejandro', 'Alonzo Gómez', '2025-11-20', 'M', 3, '3612345670901', 'Barrio San Bartolo, Salcajá', '44556677', 'roberto.gomez@mail.com', 'A+', '2025-11-25', 'activo'),
(4, 'Valentina Nicole', 'López Gómez', '2023-01-30', 'F', 4, '3312345670901', 'Sector Los Altos, La Esperanza', '44889900', 'patricia.gomez@mail.com', 'B+', '2023-02-05', 'activo');

-- 5. Catálogo de Medicamentos Pediátricos
INSERT INTO medicamento (id_medicamento, nombre, presentacion, concentracion) VALUES
(1, 'Amoxicilina', 'suspensión', '250 mg/5ml'),
(2, 'Ibuprofeno', 'suspensión', '100 mg/5ml'),
(3, 'Paracetamol', 'jarabe', '120 mg/5ml'),
(4, 'Cetirizina', 'gotas', '10 mg/ml'),
(5, 'Salbutamol', 'solución para nebulizar', '5 mg/ml'),
(6, 'Suero de Rehidratación Oral', 'sobre en polvo', '20.5 g'),
(7, 'Loratadina', 'jarabe', '5 mg/5ml'),
(8, 'Azitromicina', 'suspensión', '200 mg/5ml'),
(9, 'Amoxicilina + Ácido Clavulánico', 'suspensión', '400 mg + 57 mg/5ml'),
(10, 'Dimeticona Pediátrica', 'gotas', '40 mg/ml');

-- 6. Catálogo de Vacunas (Esquema Nacional Pediátrico)
INSERT INTO vacuna (id_vacuna, nombre, enfermedad_previene, dosis_requeridas) VALUES
(1, 'BCG', 'Tuberculosis meníngea y pulmonar grave', 1),
(2, 'Hepatitis B Pediátrica', 'Hepatitis B (transmisión perinatal)', 1),
(3, 'Pentavalente (DPT-HB-Hib)', 'Difteria, Tétanos, Tos ferina, Hepatitis B, Haemophilus influenzae tipo b', 3),
(4, 'Polio IPV', 'Poliomielitis intramuscular inactivada', 2),
(5, 'Polio bOPV', 'Poliomielitis oral bivalente', 2),
(6, 'Rotavirus', 'Diarrea aguda deshidratante por rotavirus', 2),
(7, 'Neumococo Conjugada', 'Neumonía, meningitis y bacteriemia por S. pneumoniae', 3),
(8, 'SPR', 'Sarampión, Paperas y Rubéola', 2),
(9, 'DPT Refuerzo', 'Refuerzo de Difteria, Tétanos y Tos ferina', 2),
(10, 'Influenza Pediátrica', 'Gripe estacional por influenza A y B', 2);

-- 7. Antecedentes
INSERT INTO antecedente (id_paciente, tipo, descripcion, fecha) VALUES
(1, 'alergia', 'Alergia comprobada a penicilinas y derivados', '2024-06-10'),
(2, 'enfermedad crónica', 'Dermatitis atópica infantil', '2023-03-12'),
(3, 'antecedente perinatal', 'Nacimiento pretérmino (36 semanas de gestación)', '2025-11-20'),
(4, 'alergia', 'Intolerancia temporal a la lactosa', '2023-04-05');

-- 8. Controles de Crecimiento y Desarrollo Antropométrico
INSERT INTO controlcrecimiento (id_control, id_paciente, fecha, peso, talla, perimetro_cefalico, edad_meses, observaciones) VALUES
(1, 1, '2024-07-15', 6.20, 61.00, 41.50, 2, 'Adecuado incremento ponderal y estatural. Reflejos normales.'),
(2, 1, '2024-09-15', 7.50, 66.00, 43.00, 4, 'Sostiene cabeza firmemente, sonríe a estímulos. Percentil 50.'),
(3, 1, '2024-11-15', 8.40, 70.00, 44.50, 6, 'Inicio de alimentación complementaria sugerido. Percentil 55.'),
(4, 1, '2025-05-15', 10.10, 77.00, 46.50, 12, 'Camina con apoyo, balbucea palabras simples. Curva de crecimiento estable.'),
(5, 2, '2023-09-10', 10.50, 79.50, 47.00, 12, 'Desarrollo psicomotor óptimo. Se indica control dermatológico.'),
(6, 2, '2024-09-10', 12.80, 87.00, 48.50, 24, 'Lenguaje fluido en oraciones de 2 palabras. Peso y talla acorde a edad.'),
(7, 3, '2026-01-20', 4.80, 55.00, 38.00, 2, 'Crecimiento de recuperación adecuado para prematuro.');

-- 9. Registro de Vacunación
INSERT INTO registrovacunacion (id_registro, id_paciente, id_vacuna, numero_dosis, fecha_aplicacion, proxima_fecha, lote, id_medico, observaciones) VALUES
(1, 1, 1, 1, '2024-05-16', NULL, 'BCG-2024-09', 1, 'Aplicación intradérmica en brazo derecho. Cicatrización esperada.'),
(2, 1, 2, 1, '2024-05-16', NULL, 'HEP-2024-11', 1, 'Dosis de recién nacido sin reacciones adversas.'),
(3, 1, 3, 1, '2024-07-15', '2024-09-15', 'PNT-8812', 1, 'Primera dosis pentavalente completada.'),
(4, 1, 6, 1, '2024-07-15', '2024-09-15', 'ROT-5541', 1, 'Primera dosis rotavirus vía oral tolerada.'),
(5, 1, 7, 1, '2024-07-15', '2024-09-15', 'NEU-3321', 1, 'Primera dosis neumococo completada.'),
(6, 1, 3, 2, '2024-09-15', '2024-11-15', 'PNT-9901', 1, 'Segunda dosis pentavalente completada.'),
(7, 1, 6, 2, '2024-09-15', NULL, 'ROT-6622', 1, 'Segunda dosis rotavirus completada.'),
(8, 1, 7, 2, '2024-09-15', '2025-05-15', 'NEU-4410', 1, 'Segunda dosis neumococo completada.'),
(9, 1, 8, 1, '2025-05-20', '2026-01-20', 'SPR-1029', 2, 'Primera dosis SPR aplicada al año.'),
(10, 3, 1, 1, '2025-11-21', NULL, 'BCG-2025-14', 2, 'Dosis al egreso hospitalario.');

-- 10. Consulta médica y atención completa
INSERT INTO consulta (id_consulta, id_paciente, id_medico, motivo, notas, fecha_consulta) VALUES
(1, 1, 1, 'Fiebre de 38.5°C y tos seca de 2 días de evolución', 'Infante irritable, faringe eritematosa sin placas purulentas, campos pulmonares ventilados con leves sibilancias espiratorias.', '2026-02-10');

INSERT INTO diagnostico (id_diagnostico, id_consulta, nombre, codigo_cie10, descripcion, tipo, fecha) VALUES
(1, 1, 'Rinofaringitis aguda (resfriado común)', 'J00', 'Infección viral de vías respiratorias superiores', 'definitivo', '2026-02-10');

INSERT INTO tratamiento (id_diagnostico, descripcion, duracion, fecha_inicio, fecha_fin) VALUES
(1, 'Manejo térmico con medios físicos y antipirético si temperatura > 38°C. Lavados nasales con suero fisiológico.', 5, '2026-02-10', '2026-02-15');

INSERT INTO receta (id_receta, id_consulta, codigo, fecha) VALUES
(1, 1, 'RX-PED-000001', '2026-02-10');

INSERT INTO detallereceta (id_detalle, id_receta, id_medicamento, dosis, via_administracion, frecuencia, indicaciones, duracion) VALUES
(1, 1, 3, '3.5 ml (10-15 mg/kg)', 'oral', 'cada 6 horas si hay fiebre o dolor', 'No exceder 4 tomas al día', 3);

-- 11. Facturación y Cobro
INSERT INTO factura (id_factura, id_consulta, fecha, total, estado) VALUES
(1, 1, '2026-02-10', 250.00, 'pagada');

INSERT INTO detallefactura (id_detalle_factura, id_factura, concepto, cantidad, precio_unitario, subtotal) VALUES
(1, 1, 'Consulta pediátrica especializada', 1, 250.00, 250.00);

INSERT INTO pago (id_pago, id_factura, fecha_pago, monto_total) VALUES
(1, 1, '2026-02-10', 250.00);

INSERT INTO detallepago (id_detalle_pago, id_pago, metodo_pago, monto) VALUES
(1, 1, 'tarjeta', 250.00);

