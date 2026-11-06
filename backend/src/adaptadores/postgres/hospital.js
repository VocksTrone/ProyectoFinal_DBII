// Funciones propias del Hospital General (PostgreSQL)
const { pgPool } = require('../../config/postgres');
const { AppError } = require('../../utils/helpers');
const { AHORA, vacio, esId, enTransaccion, medicoDeUsuario, bloquearPacienteActivo } = require('./comun');

// ---------- Citas ----------

const SELECT_CITA = `
  select ci.id_cita, ci.id_paciente, ci.id_medico, ci.fecha, to_char(ci.hora, 'HH24:MI') as hora, ci.estado,
         p.nombres || ' ' || p.apellidos as paciente,
         m.nombres || ' ' || m.apellidos as medico, e.nombre as especialidad
  from hospital_general.cita ci
  join hospital_general.paciente p on p.id_paciente = ci.id_paciente
  join hospital_general.medico m on m.id_medico = ci.id_medico
  join hospital_general.especialidad e on e.id_especialidad = m.id_especialidad`;

const aCita = (f) => ({
  id: String(f.id_cita),
  id_paciente: String(f.id_paciente),
  paciente: f.paciente,
  id_medico: String(f.id_medico),
  medico: f.medico,
  especialidad: f.especialidad,
  fecha: f.fecha,
  hora: f.hora,
  estado: f.estado,
});

const obtenerCita = async (id) => {
  if (!esId(id)) return null;
  const { rows } = await pgPool.query(`${SELECT_CITA} where ci.id_cita = $1`, [id]);
  return rows[0] ? aCita(rows[0]) : null;
};

// Sin filtros devuelve la agenda de hoy
const listarCitas = async ({ fecha, id_medico, id_paciente }) => {
  const condiciones = [];
  const params = [];
  const filtrar = (columna, valor) => {
    params.push(valor);
    condiciones.push(`${columna} = $${params.length}`);
  };

  if (fecha) filtrar('ci.fecha', fecha);
  if (id_medico) filtrar('ci.id_medico', id_medico);
  if (id_paciente) filtrar('ci.id_paciente', id_paciente);
  if (!condiciones.length) condiciones.push(`ci.fecha = ${AHORA}::date`);

  const { rows } = await pgPool.query(
    `${SELECT_CITA} where ${condiciones.join(' and ')} order by ci.fecha, ci.hora`,
    params
  );
  return rows.map(aCita);
};

const noEsPasada = async (db, fecha) => {
  const { rows } = await db.query(`select $1::date < ${AHORA}::date as pasada`, [fecha]);
  if (rows[0].pasada) throw new AppError('La fecha no puede ser pasada', 400);
};

// Choque con unique (id_medico, fecha, hora)
const horarioOcupado = (error) => {
  if (error.code === '23505') throw new AppError('El médico ya tiene una cita en ese horario', 409);
  throw error;
};

const agendarCita = async ({ id_paciente, id_medico, fecha, hora }) => {
  const id = await enTransaccion(async (db) => {
    await bloquearPacienteActivo(db, id_paciente);
    await noEsPasada(db, fecha);

    const { rows } = await db
      .query(
        `insert into hospital_general.cita (id_paciente, id_medico, fecha, hora)
         values ($1, $2, $3, $4) returning id_cita`,
        [id_paciente, id_medico, fecha, hora]
      )
      .catch(horarioOcupado);
    return rows[0].id_cita;
  });
  return obtenerCita(id);
};

// Solo se modifica si sigue programada
const bloquearCitaProgramada = async (db, id) => {
  const { rows } = await db.query('select estado from hospital_general.cita where id_cita = $1 for update', [id]);
  if (!rows[0]) throw new AppError('Cita no encontrada', 404);
  if (rows[0].estado !== 'programada') throw new AppError(`La cita ya está ${rows[0].estado}`, 409);
};

const reprogramarCita = async (id, { fecha, hora }) => {
  await enTransaccion(async (db) => {
    await bloquearCitaProgramada(db, id);
    await noEsPasada(db, fecha);
    await db
      .query('update hospital_general.cita set fecha = $2, hora = $3 where id_cita = $1', [id, fecha, hora])
      .catch(horarioOcupado);
  });
  return obtenerCita(id);
};

const cancelarCita = async (id) => {
  await enTransaccion(async (db) => {
    await bloquearCitaProgramada(db, id);
    await db.query("update hospital_general.cita set estado = 'cancelada' where id_cita = $1", [id]);
  });
  return obtenerCita(id);
};

// ---------- Antecedentes ----------

const agregarAntecedente = async (idPaciente, { tipo, descripcion }) =>
  enTransaccion(async (db) => {
    await bloquearPacienteActivo(db, idPaciente);
    const { rows } = await db.query(
      `insert into hospital_general.antecedente (id_paciente, tipo, descripcion, fecha)
       values ($1, $2, $3, ${AHORA}::date) returning *`,
      [idPaciente, tipo.trim(), vacio(descripcion)]
    );
    const a = rows[0];
    return { id: String(a.id_antecedente), tipo: a.tipo, descripcion: a.descripcion, fecha: a.fecha };
  });

// ---------- Internamientos ----------

const SELECT_INTERNAMIENTO = `
  select i.*, p.nombres || ' ' || p.apellidos as paciente, m.nombres || ' ' || m.apellidos as medico
  from hospital_general.internamiento i
  join hospital_general.paciente p on p.id_paciente = i.id_paciente
  join hospital_general.medico m on m.id_medico = i.id_medico`;

const aInternamiento = (f) => ({
  id: String(f.id_internamiento),
  id_paciente: String(f.id_paciente),
  paciente: f.paciente,
  id_medico: String(f.id_medico),
  medico: f.medico,
  fecha_ingreso: f.fecha_ingreso,
  fecha_egreso: f.fecha_egreso,
  motivo: f.motivo,
  estado: f.estado,
});

// estado: 'activo' (por defecto), 'dado de alta' o 'todos'
const listarInternamientos = async ({ estado = 'activo' }) => {
  const { rows } = await pgPool.query(
    `${SELECT_INTERNAMIENTO} where $1 = 'todos' or i.estado = $1 order by i.fecha_ingreso desc`,
    [estado]
  );
  return rows.map(aInternamiento);
};

const obtenerInternamiento = async (id) => {
  if (!esId(id)) return null;
  const { rows } = await pgPool.query(`${SELECT_INTERNAMIENTO} where i.id_internamiento = $1`, [id]);
  if (!rows[0]) return null;

  const [medicamentos, dietas] = await Promise.all([
    pgPool.query(
      `select mi.*, m.nombre, m.presentacion, m.concentracion
       from hospital_general.medicamentointernamiento mi
       join hospital_general.medicamento m on m.id_medicamento = mi.id_medicamento
       where mi.id_internamiento = $1 order by mi.fecha_inicio`,
      [id]
    ),
    pgPool.query(
      `select di.*, t.nombre
       from hospital_general.dietainternamiento di
       join hospital_general.tipodieta t on t.id_tipo_dieta = di.id_tipo_dieta
       where di.id_internamiento = $1 order by di.fecha_inicio`,
      [id]
    ),
  ]);

  return {
    ...aInternamiento(rows[0]),
    medicamentos: medicamentos.rows.map((f) => ({
      id: String(f.id_medicamento_internamiento),
      id_medicamento: String(f.id_medicamento),
      nombre: `${f.nombre} ${f.concentracion || ''}`.trim(),
      presentacion: f.presentacion,
      dosis: f.dosis,
      fecha_inicio: f.fecha_inicio,
      fecha_fin: f.fecha_fin,
    })),
    dietas: dietas.rows.map((f) => ({
      id: String(f.id_dieta_internamiento),
      id_tipo_dieta: String(f.id_tipo_dieta),
      nombre: f.nombre,
      fecha_inicio: f.fecha_inicio,
      fecha_fin: f.fecha_fin,
      observaciones: f.observaciones,
    })),
  };
};

const internar = async ({ id_paciente, motivo }, usuario) => {
  const id = await enTransaccion(async (db) => {
    const idMedico = await medicoDeUsuario(db, usuario);
    await bloquearPacienteActivo(db, id_paciente);

    const { rows: activo } = await db.query(
      "select 1 from hospital_general.internamiento where id_paciente = $1 and estado = 'activo'",
      [id_paciente]
    );
    if (activo.length) throw new AppError('El paciente ya está internado', 409);

    const { rows } = await db.query(
      `insert into hospital_general.internamiento (id_paciente, id_medico, fecha_ingreso, motivo)
       values ($1, $2, ${AHORA}::date, $3) returning id_internamiento`,
      [id_paciente, idMedico, motivo.trim()]
    );
    return rows[0].id_internamiento;
  });
  return obtenerInternamiento(id);
};

const bloquearInternamientoActivo = async (db, id) => {
  const { rows } = await db.query(
    'select estado from hospital_general.internamiento where id_internamiento = $1 for update',
    [id]
  );
  if (!rows[0]) throw new AppError('Internamiento no encontrado', 404);
  if (rows[0].estado !== 'activo') throw new AppError('El internamiento ya fue dado de alta', 409);
};

const agregarMedicamentoInternamiento = async (id, { id_medicamento, dosis, fecha_inicio, fecha_fin }) => {
  await enTransaccion(async (db) => {
    await bloquearInternamientoActivo(db, id);
    await db.query(
      `insert into hospital_general.medicamentointernamiento (id_internamiento, id_medicamento, dosis, fecha_inicio, fecha_fin)
       values ($1, $2, $3, coalesce($4::date, ${AHORA}::date), $5)`,
      [id, id_medicamento, dosis.trim(), vacio(fecha_inicio), vacio(fecha_fin)]
    );
  });
  return obtenerInternamiento(id);
};

const agregarDieta = async (id, { id_tipo_dieta, fecha_inicio, fecha_fin, observaciones }) => {
  await enTransaccion(async (db) => {
    await bloquearInternamientoActivo(db, id);
    await db.query(
      `insert into hospital_general.dietainternamiento (id_internamiento, id_tipo_dieta, fecha_inicio, fecha_fin, observaciones)
       values ($1, $2, coalesce($3::date, ${AHORA}::date), $4, $5)`,
      [id, id_tipo_dieta, vacio(fecha_inicio), vacio(fecha_fin), vacio(observaciones)]
    );
  });
  return obtenerInternamiento(id);
};

// Alta: cierra el internamiento y sus medicamentos y dietas abiertos
const darAlta = async (id) => {
  await enTransaccion(async (db) => {
    await bloquearInternamientoActivo(db, id);
    await db.query(
      `update hospital_general.internamiento
       set estado = 'dado de alta', fecha_egreso = greatest(fecha_ingreso, ${AHORA}::date)
       where id_internamiento = $1`,
      [id]
    );
    await db.query(
      `update hospital_general.medicamentointernamiento set fecha_fin = greatest(fecha_inicio, ${AHORA}::date)
       where id_internamiento = $1 and fecha_fin is null`,
      [id]
    );
    await db.query(
      `update hospital_general.dietainternamiento set fecha_fin = greatest(fecha_inicio, ${AHORA}::date)
       where id_internamiento = $1 and fecha_fin is null`,
      [id]
    );
  });
  return obtenerInternamiento(id);
};

module.exports = {
  listarCitas,
  obtenerCita,
  agendarCita,
  reprogramarCita,
  cancelarCita,
  agregarAntecedente,
  listarInternamientos,
  obtenerInternamiento,
  internar,
  agregarMedicamentoInternamiento,
  agregarDieta,
  darAlta,
};
