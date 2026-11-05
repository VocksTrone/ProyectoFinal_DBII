-- Datos de prueba del Hospital General
-- Contraseña de los usuarios de prueba: Hospital2026!

begin;
set local search_path to hospital_general;

insert into especialidad (nombre) values
    ('Medicina General'), ('Cardiología'), ('Pediatría'),
    ('Ginecología'), ('Traumatología'), ('Neurología');

insert into medico (nombres, apellidos, colegiado, id_especialidad, telefono, correo) values
    ('Roberto', 'Díaz López', 'COL-10234', 1, '55123456', 'rdiaz@hospital.gt'),
    ('María', 'Fuentes Ruiz', 'COL-11872', 2, '55987654', 'mfuentes@hospital.gt');

insert into usuario (usuario, nombre, rol, password_hash, id_medico) values
    ('rdiaz', 'Dr. Roberto Díaz', 'medico', '$2b$10$QWGmbK6UpbX5PYYWBodT8OwvBm5PezF202TqvJWEzJJtjDkMCM3gy', 1),
    ('mfuentes', 'Dra. María Fuentes', 'medico', '$2b$10$QWGmbK6UpbX5PYYWBodT8OwvBm5PezF202TqvJWEzJJtjDkMCM3gy', 2),
    ('lmendez', 'Laura Méndez', 'secretaria', '$2b$10$QWGmbK6UpbX5PYYWBodT8OwvBm5PezF202TqvJWEzJJtjDkMCM3gy', null);

insert into medicamento (nombre, presentacion, concentracion) values
    ('Paracetamol', 'tableta', '500 mg'),
    ('Ibuprofeno', 'tableta', '400 mg'),
    ('Amoxicilina', 'cápsula', '500 mg'),
    ('Loratadina', 'tableta', '10 mg'),
    ('Omeprazol', 'cápsula', '20 mg'),
    ('Metformina', 'tableta', '850 mg'),
    ('Losartán', 'tableta', '50 mg'),
    ('Salbutamol', 'inhalador', '100 mcg');

insert into tipodieta (nombre, descripcion) values
    ('Blanda', 'Alimentos suaves y fáciles de digerir'),
    ('Líquida', 'Solo líquidos claros'),
    ('Diabética', 'Control de carbohidratos'),
    ('Hiposódica', 'Baja en sodio');

insert into paciente (nombres, apellidos, fecha_nacimiento, sexo, dpi, direccion, telefono, correo, tipo_sangre) values
    ('Ana Lucía', 'Pérez García', '1990-05-20', 'F', '2456789010101', 'Zona 3, Quetzaltenango', '41234567', 'ana.perez@mail.com', 'O+'),
    ('Carlos', 'Morales Xicará', '1978-11-02', 'M', '1987654320901', 'Zona 1, Quetzaltenango', '42345678', null, 'A+'),
    ('Sofía', 'Ramírez Coyoy', '2001-02-14', 'F', '3012345670901', 'Salcajá', '43456789', 'sofia.rc@mail.com', 'B-');

insert into antecedente (id_paciente, tipo, descripcion) values
    (1, 'alergia', 'Alergia a la penicilina'),
    (2, 'enfermedad crónica', 'Hipertensión arterial');

commit;
