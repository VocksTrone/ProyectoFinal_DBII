-- Hospital General (PostgreSQL / Supabase)

begin;

-- Borrar tablas viejas de la plantilla
drop table if exists public.consultas cascade;
drop table if exists public.medicos cascade;
drop table if exists public.pacientes cascade;

drop schema if exists hospital_general cascade;
create schema hospital_general;
set local search_path to hospital_general;

-- Catálogos
create table especialidad (
    id_especialidad serial primary key,
    nombre varchar(80) not null unique
);

create table medicamento (
    id_medicamento serial primary key,
    nombre varchar(120) not null,
    presentacion varchar(50),
    concentracion varchar(30),
    unique (nombre, presentacion, concentracion)
);

create table tipodieta (
    id_tipo_dieta serial primary key,
    nombre varchar(80) not null unique,
    descripcion text
);

-- Personas
create table medico (
    id_medico serial primary key,
    nombres varchar(100) not null,
    apellidos varchar(100) not null,
    colegiado varchar(20) not null unique,
    id_especialidad int not null references especialidad(id_especialidad),
    telefono varchar(8),
    correo varchar(100)
);

create table paciente (
    id_paciente serial primary key,
    nombres varchar(100) not null,
    apellidos varchar(100) not null,
    fecha_nacimiento date not null,
    sexo char(1) not null check (sexo in ('M', 'F')),
    dpi varchar(13) unique,
    direccion varchar(200),
    telefono varchar(8),
    correo varchar(100),
    tipo_sangre varchar(3) check (tipo_sangre in ('A+','A-','B+','B-','AB+','AB-','O+','O-')),
    fecha_registro date not null default current_date,
    -- Para archivar el historial
    estado varchar(20) not null default 'activo' check (estado in ('activo', 'archivado')),
    motivo_baja varchar(200),
    fecha_baja date,
    check (
        (estado = 'activo' and fecha_baja is null)
        or (estado = 'archivado' and fecha_baja is not null and motivo_baja is not null)
    )
);

create table antecedente (
    id_antecedente serial primary key,
    id_paciente int not null references paciente(id_paciente),
    tipo varchar(30) not null,
    descripcion text,
    fecha date not null default current_date
);

-- Atención: cita -> consulta -> diagnóstico -> tratamiento / receta
create table cita (
    id_cita serial primary key,
    id_paciente int not null references paciente(id_paciente),
    id_medico int not null references medico(id_medico),
    fecha date not null,
    hora time not null,
    estado varchar(20) not null default 'programada' check (estado in ('programada', 'atendida', 'cancelada')),
    unique (id_medico, fecha, hora) -- un médico no tiene dos citas a la misma hora
);

create table consulta (
    id_consulta serial primary key,
    id_cita int not null unique references cita(id_cita),
    motivo varchar(200),
    notas text,
    fecha_consulta date not null default current_date
);

create table diagnostico (
    id_diagnostico serial primary key,
    id_consulta int not null references consulta(id_consulta),
    codigo_cie10 varchar(10),
    nombre varchar(150) not null,
    descripcion text,
    tipo varchar(20) not null default 'presuntivo' check (tipo in ('presuntivo', 'definitivo')),
    fecha date not null default current_date
);

create table tratamiento (
    id_tratamiento serial primary key,
    id_diagnostico int not null references diagnostico(id_diagnostico),
    descripcion text not null,
    duracion int check (duracion > 0),
    fecha_inicio date,
    fecha_fin date,
    check (fecha_fin is null or fecha_inicio is null or fecha_fin >= fecha_inicio)
);

create table receta (
    id_receta serial primary key,
    id_consulta int not null references consulta(id_consulta),
    codigo varchar(20) not null unique, -- código de control
    fecha date not null default current_date
);

create table detallereceta (
    id_detalle serial primary key,
    id_receta int not null references receta(id_receta),
    id_medicamento int not null references medicamento(id_medicamento),
    dosis varchar(50) not null,
    via_administracion varchar(30),
    frecuencia varchar(50),
    indicaciones text,
    duracion int check (duracion > 0)
);

-- Internamiento
create table internamiento (
    id_internamiento serial primary key,
    id_paciente int not null references paciente(id_paciente),
    id_medico int not null references medico(id_medico),
    fecha_ingreso date not null default current_date,
    fecha_egreso date,
    motivo varchar(200),
    estado varchar(20) not null default 'activo' check (estado in ('activo', 'dado de alta')),
    check (fecha_egreso is null or fecha_egreso >= fecha_ingreso)
);

create table medicamentointernamiento (
    id_medicamento_internamiento serial primary key,
    id_internamiento int not null references internamiento(id_internamiento),
    id_medicamento int not null references medicamento(id_medicamento),
    dosis varchar(50),
    fecha_inicio date not null,
    fecha_fin date,
    check (fecha_fin is null or fecha_fin >= fecha_inicio)
);

create table dietainternamiento (
    id_dieta_internamiento serial primary key,
    id_internamiento int not null references internamiento(id_internamiento),
    id_tipo_dieta int not null references tipodieta(id_tipo_dieta),
    fecha_inicio date not null,
    fecha_fin date,
    observaciones text,
    check (fecha_fin is null or fecha_fin >= fecha_inicio)
);

-- Facturación
create table factura (
    id_factura serial primary key,
    id_paciente int not null references paciente(id_paciente),
    id_cita int references cita(id_cita),
    id_internamiento int references internamiento(id_internamiento),
    fecha_factura date not null default current_date,
    total_factura decimal(10,2) not null check (total_factura >= 0),
    estado varchar(20) not null default 'pendiente' check (estado in ('pendiente', 'pagada', 'anulada')),
    -- la factura es de una cita o de un internamiento, no de ambos
    constraint chk_factura_origen check (
        (id_cita is not null and id_internamiento is null)
        or (id_cita is null and id_internamiento is not null)
    )
);

create table detallefactura (
    id_detalle_factura serial primary key,
    id_factura int not null references factura(id_factura),
    concepto varchar(150) not null,
    cantidad int not null check (cantidad > 0),
    precio_unitario decimal(10,2) not null check (precio_unitario >= 0),
    subtotal decimal(10,2) not null,
    check (subtotal = cantidad * precio_unitario)
);

create table pago (
    id_pago serial primary key,
    id_factura int not null references factura(id_factura),
    fecha_pago date not null default current_date,
    monto_total decimal(10,2) not null check (monto_total > 0)
);

create table detallepago (
    id_detalle_pago serial primary key,
    id_pago int not null references pago(id_pago),
    metodo_pago varchar(30) not null check (metodo_pago in ('efectivo', 'tarjeta', 'transferencia')),
    monto decimal(10,2) not null check (monto > 0)
);

commit;
