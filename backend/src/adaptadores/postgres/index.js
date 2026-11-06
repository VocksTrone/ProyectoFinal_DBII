// Adaptador del Hospital General (PostgreSQL)
const { pgPool } = require('../../config/postgres');
const { AppError } = require('../../utils/helpers');
const { AHORA, vacio, esId, enTransaccion, medicoDeUsuario, bloquearPacienteActivo } = require('./comun');

// Fila de paciente -> formato del contrato
const aPaciente = (f) => ({
  id: String(f.id_paciente),
  dpi: f.dpi,
  nombres: f.nombres,
  apellidos: f.apellidos,
  fecha_nacimiento: f.fecha_nacimiento,
  sexo: f.sexo,
  telefono: f.telefono,
  correo: f.correo,
  direccion: f.direccion,
  estado: f.estado,
  extra: {
    tipo_sangre: f.tipo_sangre,
    fecha_registro: f.fecha_registro,
    motivo_baja: f.motivo_baja,
    fecha_baja: f.fecha_baja,
  },
});

// Consultas con sus diagnósticos, tratamientos y receta
const cargarAtenciones = async (db, filtro, params) => {
  const { rows: consultas } = await db.query(
    `select c.id_consulta, c.fecha_consulta, c.motivo, c.notas, ci.id_cita, ci.hora,
            m.nombres || ' ' || m.apellidos as profesional, e.nombre as especialidad
     from hospital_general.consulta c
     join hospital_general.cita ci on ci.id_cita = c.id_cita
     join hospital_general.medico m on m.id_medico = ci.id_medico
     join hospital_general.especialidad e on e.id_especialidad = m.id_especialidad
     where ${filtro}
     order by c.fecha_consulta desc, c.id_consulta desc`,
    params
  );
  if (!consultas.length) return [];

  const ids = consultas.map((c) => c.id_consulta);

  const { rows: diagnosticos } = await db.query(
    'select * from hospital_general.diagnostico where id_consulta = any($1) order by id_diagnostico',
    [ids]
  );

  const { rows: tratamientos } = await db.query(
    'select * from hospital_general.tratamiento where id_diagnostico = any($1) order by id_tratamiento',
    [diagnosticos.map((d) => d.id_diagnostico)]
  );

  const { rows: recetas } = await db.query(
    `select r.id_receta, r.id_consulta, r.codigo, r.fecha,
            dr.id_medicamento, dr.dosis, dr.frecuencia, dr.via_administracion, dr.duracion, dr.indicaciones,
            m.nombre, m.presentacion, m.concentracion
     from hospital_general.receta r
     left join hospital_general.detallereceta dr on dr.id_receta = r.id_receta
     left join hospital_general.medicamento m on m.id_medicamento = dr.id_medicamento
     where r.id_consulta = any($1)
     order by r.id_receta, dr.id_detalle`,
    [ids]
  );

  return consultas.map((c) => {
    const filasReceta = recetas.filter((r) => r.id_consulta === c.id_consulta);
    const receta = filasReceta[0];

    return {
      id: String(c.id_consulta),
      fecha: c.fecha_consulta,
      profesional: c.profesional,
      motivo: c.motivo,
      notas: c.notas,
      diagnosticos: diagnosticos
        .filter((d) => d.id_consulta === c.id_consulta)
        .map((d) => ({
          id: String(d.id_diagnostico),
          nombre: d.nombre,
          tipo: d.tipo,
          codigo: d.codigo_cie10,
          descripcion: d.descripcion,
          fecha: d.fecha,
          tratamientos: tratamientos
            .filter((t) => t.id_diagnostico === d.id_diagnostico)
            .map((t) => ({
              id: String(t.id_tratamiento),
              descripcion: t.descripcion,
              duracion_dias: t.duracion,
              fecha_inicio: t.fecha_inicio,
              fecha_fin: t.fecha_fin,
            })),
        })),
      receta: receta
        ? {
            id: String(receta.id_receta),
            codigo: receta.codigo,
            fecha: receta.fecha,
            medicamentos: filasReceta
              .filter((r) => r.id_receta === receta.id_receta && r.id_medicamento)
              .map((r) => ({
                id_medicamento: String(r.id_medicamento),
                nombre: `${r.nombre} ${r.concentracion || ''}`.trim(),
                presentacion: r.presentacion,
                dosis: r.dosis,
                frecuencia: r.frecuencia,
                via: r.via_administracion,
                duracion_dias: r.duracion,
                indicaciones: r.indicaciones,
              })),
          }
        : null,
      extra: { id_cita: String(c.id_cita), hora: c.hora, especialidad: c.especialidad },
    };
  });
};

const buscarUsuario = async (usuario) => {
  const { rows } = await pgPool.query(
    `select id_usuario as id, nombre, rol, password_hash
     from hospital_general.usuario where usuario = $1 and activo`,
    [usuario]
  );
  return rows[0] || null;
};

const buscarPacientes = async (texto) => {
  const { rows } = await pgPool.query(
    `select * from hospital_general.paciente
     where $1 = '' or dpi = $1 or (nombres || ' ' || apellidos) ilike '%' || $1 || '%'
     order by apellidos, nombres
     limit 100`,
    [texto]
  );
  return rows.map(aPaciente);
};

const crearPaciente = async (d) => {
  const { rows } = await pgPool.query(
    `insert into hospital_general.paciente
       (nombres, apellidos, fecha_nacimiento, sexo, dpi, direccion, telefono, correo, tipo_sangre)
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     returning *`,
    [
      d.nombres.trim(),
      d.apellidos.trim(),
      d.fecha_nacimiento,
      d.sexo,
      vacio(d.dpi),
      vacio(d.direccion),
      vacio(d.telefono),
      vacio(d.correo),
      vacio(d.extra?.tipo_sangre),
    ]
  );
  return aPaciente(rows[0]);
};

const obtenerPaciente = async (id) => {
  if (!esId(id)) return null;
  const { rows } = await pgPool.query('select * from hospital_general.paciente where id_paciente = $1', [id]);
  return rows[0] ? aPaciente(rows[0]) : null;
};

const obtenerHistorial = async (id) => {
  const paciente = await obtenerPaciente(id);
  if (!paciente) return null;

  const [antecedentes, atenciones, internamientos] = await Promise.all([
    pgPool.query(
      'select * from hospital_general.antecedente where id_paciente = $1 order by fecha desc',
      [id]
    ),
    cargarAtenciones(pgPool, 'ci.id_paciente = $1', [id]),
    pgPool.query(
      `select i.*, m.nombres || ' ' || m.apellidos as medico
       from hospital_general.internamiento i
       join hospital_general.medico m on m.id_medico = i.id_medico
       where i.id_paciente = $1
       order by i.fecha_ingreso desc`,
      [id]
    ),
  ]);

  return {
    paciente,
    antecedentes: antecedentes.rows.map((a) => ({
      id: String(a.id_antecedente),
      tipo: a.tipo,
      descripcion: a.descripcion,
      fecha: a.fecha,
    })),
    atenciones,
    extra: {
      internamientos: internamientos.rows.map((i) => ({
        id: String(i.id_internamiento),
        fecha_ingreso: i.fecha_ingreso,
        fecha_egreso: i.fecha_egreso,
        motivo: i.motivo,
        estado: i.estado,
        medico: i.medico,
      })),
    },
  };
};

// Archiva al paciente y cancela sus citas pendientes
const archivarPaciente = async (id, motivo) =>
  enTransaccion(async (db) => {
    const { rows } = await db.query(
      `update hospital_general.paciente
       set estado = 'archivado', motivo_baja = $2, fecha_baja = ${AHORA}::date
       where id_paciente = $1 and estado = 'activo'
       returning *`,
      [id, motivo]
    );
    if (!rows.length) throw new AppError('El paciente no existe o ya está archivado', 409);

    await db.query(
      `update hospital_general.cita set estado = 'cancelada'
       where id_paciente = $1 and estado = 'programada'`,
      [id]
    );
    return aPaciente(rows[0]);
  });

// Cita -> consulta -> diagnósticos -> tratamientos -> receta, en una sola transacción
const registrarAtencion = async (idPaciente, d, usuario) => {
  const idConsulta = await enTransaccion(async (db) => {
    const idMedico = await medicoDeUsuario(db, usuario);

    // Bloquea al paciente para que no lo archiven a medio registro
    await bloquearPacienteActivo(db, idPaciente);

    // Usa la cita indicada o crea una al momento
    let idCita = d.extra?.id_cita;
    if (idCita) {
      const { rows: c } = await db.query(
        'select estado from hospital_general.cita where id_cita = $1 and id_paciente = $2 for update',
        [idCita, idPaciente]
      );
      if (!c[0]) throw new AppError('La cita no existe para este paciente', 400);
      if (c[0].estado !== 'programada') throw new AppError(`La cita ya está ${c[0].estado}`, 409);

      await db.query("update hospital_general.cita set estado = 'atendida' where id_cita = $1", [idCita]);
    } else {
      const { rows: c } = await db.query(
        `insert into hospital_general.cita (id_paciente, id_medico, fecha, hora, estado)
         values ($1, $2, ${AHORA}::date, ${AHORA}::time, 'atendida')
         returning id_cita`,
        [idPaciente, idMedico]
      );
      idCita = c[0].id_cita;
    }

    const { rows: consulta } = await db.query(
      `insert into hospital_general.consulta (id_cita, motivo, notas, fecha_consulta)
       values ($1, $2, $3, ${AHORA}::date)
       returning id_consulta`,
      [idCita, d.motivo.trim(), vacio(d.notas)]
    );
    const id = consulta[0].id_consulta;

    for (const dx of d.diagnosticos || []) {
      const { rows } = await db.query(
        `insert into hospital_general.diagnostico (id_consulta, codigo_cie10, nombre, descripcion, tipo, fecha)
         values ($1, $2, $3, $4, $5, ${AHORA}::date)
         returning id_diagnostico`,
        [id, vacio(dx.codigo), dx.nombre.trim(), vacio(dx.descripcion), dx.tipo || 'presuntivo']
      );

      for (const t of dx.tratamientos || []) {
        await db.query(
          `insert into hospital_general.tratamiento (id_diagnostico, descripcion, duracion, fecha_inicio, fecha_fin)
           values ($1, $2, $3, $4, $5)`,
          [rows[0].id_diagnostico, t.descripcion.trim(), vacio(t.duracion_dias), vacio(t.fecha_inicio), vacio(t.fecha_fin)]
        );
      }
    }

    if (d.receta) {
      const { rows } = await db.query(
        `insert into hospital_general.receta (id_consulta, codigo, fecha)
         values ($1, $2, ${AHORA}::date)
         returning id_receta`,
        [id, `RX-${String(id).padStart(6, '0')}`]
      );

      for (const m of d.receta.medicamentos) {
        await db.query(
          `insert into hospital_general.detallereceta
             (id_receta, id_medicamento, dosis, via_administracion, frecuencia, indicaciones, duracion)
           values ($1, $2, $3, $4, $5, $6, $7)`,
          [rows[0].id_receta, m.id_medicamento, m.dosis.trim(), vacio(m.via), vacio(m.frecuencia), vacio(m.indicaciones), vacio(m.duracion_dias)]
        );
      }
    }

    return id;
  });

  const [atencion] = await cargarAtenciones(pgPool, 'c.id_consulta = $1', [idConsulta]);
  return atencion;
};

const catalogos = {
  medicamentos:
    'select id_medicamento as id, nombre, presentacion, concentracion from hospital_general.medicamento order by nombre',
  especialidades: 'select id_especialidad as id, nombre from hospital_general.especialidad order by nombre',
  medicos: `select m.id_medico as id, m.nombres || ' ' || m.apellidos as nombre, m.colegiado, e.nombre as especialidad
            from hospital_general.medico m
            join hospital_general.especialidad e on e.id_especialidad = m.id_especialidad
            order by nombre`,
  dietas: 'select id_tipo_dieta as id, nombre, descripcion from hospital_general.tipodieta order by nombre',
};

const obtenerCatalogo = async (tipo) => {
  if (!Object.hasOwn(catalogos, tipo)) return null;
  const { rows } = await pgPool.query(catalogos[tipo]);
  return rows.map((r) => ({ ...r, id: String(r.id) }));
};

module.exports = {
  buscarUsuario,
  buscarPacientes,
  crearPaciente,
  obtenerPaciente,
  obtenerHistorial,
  archivarPaciente,
  registrarAtencion,
  obtenerCatalogo,
};
