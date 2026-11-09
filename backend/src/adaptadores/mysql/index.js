const { mysqlPool } = require('../../config/mysql');
const { AppError } = require('../../utils/helpers');
const {
  vacio,
  esId,
  aFecha,
  enTransaccion,
  medicoDeUsuario,
  bloquearPacienteActivo,
  aPaciente,
} = require('./comun');

const SELECT_PACIENTE = `
  SELECT p.*,
         e.nombres AS encargado_nombres,
         e.apellidos AS encargado_apellidos,
         e.parentesco AS encargado_parentesco,
         e.telefono AS encargado_telefono,
         e.direccion AS encargado_direccion,
         e.correo AS encargado_correo,
         e.dpi AS encargado_dpi
  FROM paciente p
  LEFT JOIN encargado e ON e.id_encargado = p.id_encargado
`;

const cargarAtenciones = async (conn, filtro, params) => {
  const [consultas] = await conn.query(
    `SELECT c.id_consulta, c.fecha_consulta, c.motivo, c.notas, c.id_medico,
            CONCAT(m.nombres, ' ', m.apellidos) AS profesional, m.colegiado
     FROM consulta c
     JOIN medico m ON m.id_medico = c.id_medico
     WHERE ${filtro}
     ORDER BY c.fecha_consulta DESC, c.id_consulta DESC`,
    params
  );

  if (!consultas.length) return [];

  const ids = consultas.map((c) => c.id_consulta);

  const [diagnosticos] = await conn.query(
    `SELECT * FROM diagnostico WHERE id_consulta IN (?) ORDER BY id_diagnostico`,
    [ids]
  );

  const idsDiag = diagnosticos.map((d) => d.id_diagnostico);
  const tratamientos = idsDiag.length
    ? (await conn.query(`SELECT * FROM tratamiento WHERE id_diagnostico IN (?) ORDER BY id_tratamiento`, [idsDiag]))[0]
    : [];

  const [recetas] = await conn.query(
    `SELECT r.id_receta, r.id_consulta, r.codigo, r.fecha,
            dr.id_detalle, dr.id_medicamento, dr.dosis, dr.frecuencia, dr.via_administracion, dr.duracion, dr.indicaciones,
            m.nombre, m.presentacion, m.concentracion
     FROM receta r
     LEFT JOIN detallereceta dr ON dr.id_receta = r.id_receta
     LEFT JOIN medicamento m ON m.id_medicamento = dr.id_medicamento
     WHERE r.id_consulta IN (?)
     ORDER BY r.id_receta, dr.id_detalle`,
    [ids]
  );

  return consultas.map((c) => {
    const filasReceta = recetas.filter((r) => r.id_consulta === c.id_consulta);
    const receta = filasReceta[0];

    return {
      id: String(c.id_consulta),
      fecha: aFecha(c.fecha_consulta),
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
          fecha: aFecha(d.fecha),
          tratamientos: tratamientos
            .filter((t) => t.id_diagnostico === d.id_diagnostico)
            .map((t) => ({
              id: String(t.id_tratamiento),
              descripcion: t.descripcion,
              duracion_dias: t.duracion,
              fecha_inicio: aFecha(t.fecha_inicio),
              fecha_fin: aFecha(t.fecha_fin),
            })),
        })),
      receta: receta && receta.id_receta
        ? {
            id: String(receta.id_receta),
            codigo: receta.codigo,
            fecha: aFecha(receta.fecha),
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
      extra: { id_medico: String(c.id_medico), colegiado: c.colegiado },
    };
  });
};


const buscarUsuario = async (usuario) => {
  const [rows] = await mysqlPool.query(
    `SELECT id_usuario AS id, nombre, rol, password_hash
     FROM usuario
     WHERE usuario = ? AND activo = 1`,
    [usuario]
  );
  return rows[0] || null;
};

const buscarPacientes = async (texto) => {
  const t = vacio(texto) || '';
  const [rows] = await mysqlPool.query(
    `${SELECT_PACIENTE}
     WHERE ? = '' OR p.dpi = ? OR CONCAT(p.nombres, ' ', p.apellidos) LIKE CONCAT('%', ?, '%')
     ORDER BY p.apellidos, p.nombres
     LIMIT 100`,
    [t, t, t]
  );
  return rows.map(aPaciente);
};

const crearPaciente = async (d) => {
  return enTransaccion(async (conn) => {
    let idEncargado = d.extra?.id_encargado || d.id_encargado;

    if (!idEncargado && d.extra?.encargado) {
      const enc = d.extra.encargado;
      const [resEnc] = await conn.query(
        `INSERT INTO encargado (nombres, apellidos, parentesco, telefono, direccion, correo, dpi)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          enc.nombres?.trim() || 'Tutor',
          enc.apellidos?.trim() || 'Principal',
          enc.parentesco?.trim() || 'Padre/Madre',
          enc.telefono?.trim() || d.telefono?.trim() || '00000000',
          vacio(enc.direccion || d.direccion),
          vacio(enc.correo || d.correo),
          vacio(enc.dpi),
        ]
      );
      idEncargado = resEnc.insertId;
    }

    // Sin encargado se usa el primero que exista o uno genérico
    if (!idEncargado) {
      const [encargados] = await conn.query('SELECT id_encargado FROM encargado LIMIT 1');
      if (encargados.length) {
        idEncargado = encargados[0].id_encargado;
      } else {
        const [resNuevoEnc] = await conn.query(
          `INSERT INTO encargado (nombres, apellidos, parentesco, telefono, direccion, correo)
           VALUES ('Encargado', 'General', 'Tutor Legal', '55555555', 'Quetzaltenango', 'tutor@pediatria.gt')`
        );
        idEncargado = resNuevoEnc.insertId;
      }
    }

    const [res] = await conn.query(
      `INSERT INTO paciente
         (nombres, apellidos, fecha_nacimiento, sexo, id_encargado, dpi, direccion, telefono, correo, tipo_sangre)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        d.nombres.trim(),
        d.apellidos.trim(),
        d.fecha_nacimiento,
        d.sexo,
        idEncargado,
        vacio(d.dpi),
        vacio(d.direccion),
        vacio(d.telefono),
        vacio(d.correo),
        vacio(d.extra?.tipo_sangre),
      ]
    );

    const [filas] = await conn.query(`${SELECT_PACIENTE} WHERE p.id_paciente = ?`, [res.insertId]);
    return aPaciente(filas[0]);
  });
};

const obtenerPaciente = async (id) => {
  if (!esId(id)) return null;
  const [rows] = await mysqlPool.query(`${SELECT_PACIENTE} WHERE p.id_paciente = ?`, [id]);
  return rows[0] ? aPaciente(rows[0]) : null;
};

const obtenerHistorial = async (id) => {
  const paciente = await obtenerPaciente(id);
  if (!paciente) return null;

  const [antecedentesRows] = await mysqlPool.query(
    'SELECT * FROM antecedente WHERE id_paciente = ? ORDER BY fecha DESC',
    [id]
  );

  const atenciones = await cargarAtenciones(mysqlPool, 'c.id_paciente = ?', [id]);

  const [controles] = await mysqlPool.query(
    `SELECT id_control, fecha, peso, talla, perimetro_cefalico, edad_meses, observaciones
     FROM controlcrecimiento
     WHERE id_paciente = ?
     ORDER BY fecha DESC, edad_meses DESC`,
    [id]
  );

  const [vacunas] = await mysqlPool.query(
    `SELECT r.id_registro, r.id_vacuna, r.numero_dosis, r.fecha_aplicacion, r.proxima_fecha,
            r.lote, r.observaciones, v.nombre AS vacuna, v.enfermedad_previene, v.dosis_requeridas,
            CONCAT(m.nombres, ' ', m.apellidos) AS profesional
     FROM registrovacunacion r
     JOIN vacuna v ON v.id_vacuna = r.id_vacuna
     LEFT JOIN medico m ON m.id_medico = r.id_medico
     WHERE r.id_paciente = ?
     ORDER BY r.fecha_aplicacion DESC`,
    [id]
  );

  return {
    paciente,
    antecedentes: antecedentesRows.map((a) => ({
      id: String(a.id_antecedente),
      tipo: a.tipo,
      descripcion: a.descripcion,
      fecha: aFecha(a.fecha),
    })),
    atenciones,
    extra: {
      controles_crecimiento: controles.map((c) => ({
        id: String(c.id_control),
        fecha: aFecha(c.fecha),
        peso: Number(c.peso),
        talla: Number(c.talla),
        perimetro_cefalico: c.perimetro_cefalico ? Number(c.perimetro_cefalico) : null,
        edad_meses: c.edad_meses,
        observaciones: c.observaciones,
      })),
      vacunas: vacunas.map((v) => ({
        id: String(v.id_registro),
        id_vacuna: String(v.id_vacuna),
        vacuna: v.vacuna,
        enfermedad_previene: v.enfermedad_previene,
        numero_dosis: v.numero_dosis,
        dosis_requeridas: v.dosis_requeridas,
        fecha_aplicacion: aFecha(v.fecha_aplicacion),
        proxima_fecha: aFecha(v.proxima_fecha),
        lote: v.lote,
        profesional: v.profesional,
        observaciones: v.observaciones,
      })),
      encargado: paciente.extra?.encargado || null,
    },
  };
};

const archivarPaciente = async (id, motivo) =>
  enTransaccion(async (conn) => {
    const [res] = await conn.query(
      `UPDATE paciente
       SET estado = 'archivado', motivo_baja = ?, fecha_baja = CURRENT_DATE()
       WHERE id_paciente = ? AND estado = 'activo'`,
      [motivo, id]
    );

    if (res.affectedRows === 0) {
      throw new AppError('El paciente no existe o ya está archivado', 409);
    }

    const [rows] = await conn.query(`${SELECT_PACIENTE} WHERE p.id_paciente = ?`, [id]);
    return aPaciente(rows[0]);
  });

// Consulta, diagnósticos y receta en una sola transacción
const registrarAtencion = async (idPaciente, d, usuario) => {
  const idConsulta = await enTransaccion(async (conn) => {
    const idMedico = await medicoDeUsuario(conn, usuario);
    await bloquearPacienteActivo(conn, idPaciente);

    const [resConsulta] = await conn.query(
      `INSERT INTO consulta (id_paciente, id_medico, motivo, notas, fecha_consulta)
       VALUES (?, ?, ?, ?, CURRENT_DATE())`,
      [idPaciente, idMedico, d.motivo.trim(), vacio(d.notas)]
    );
    const id = resConsulta.insertId;

    for (const dx of d.diagnosticos || []) {
      const [resDiag] = await conn.query(
        `INSERT INTO diagnostico (id_consulta, codigo_cie10, nombre, descripcion, tipo, fecha)
         VALUES (?, ?, ?, ?, ?, CURRENT_DATE())`,
        [id, vacio(dx.codigo), dx.nombre.trim(), vacio(dx.descripcion), dx.tipo || 'presuntivo']
      );

      for (const t of dx.tratamientos || []) {
        await conn.query(
          `INSERT INTO tratamiento (id_diagnostico, descripcion, duracion, fecha_inicio, fecha_fin)
           VALUES (?, ?, ?, ?, ?)`,
          [resDiag.insertId, t.descripcion.trim(), vacio(t.duracion_dias), vacio(t.fecha_inicio), vacio(t.fecha_fin)]
        );
      }
    }

    if (d.receta) {
      const codigo = `RX-PED-${String(id).padStart(6, '0')}`;
      const [resReceta] = await conn.query(
        `INSERT INTO receta (id_consulta, codigo, fecha)
         VALUES (?, ?, CURRENT_DATE())`,
        [id, codigo]
      );

      for (const m of d.receta.medicamentos || []) {
        await conn.query(
          `INSERT INTO detallereceta
             (id_receta, id_medicamento, dosis, via_administracion, frecuencia, indicaciones, duracion)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            resReceta.insertId,
            m.id_medicamento,
            m.dosis.trim(),
            vacio(m.via),
            vacio(m.frecuencia),
            vacio(m.indicaciones),
            vacio(m.duracion_dias),
          ]
        );
      }
    }

    return id;
  });

  const [atencion] = await cargarAtenciones(mysqlPool, 'c.id_consulta = ?', [idConsulta]);
  return atencion;
};

const catalogos = {
  medicamentos: `SELECT id_medicamento AS id, nombre, presentacion, concentracion FROM medicamento ORDER BY nombre`,
  vacunas: `SELECT id_vacuna AS id, nombre, enfermedad_previene, dosis_requeridas FROM vacuna ORDER BY nombre`,
  medicos: `SELECT id_medico AS id, CONCAT(nombres, ' ', apellidos) AS nombre, colegiado FROM medico ORDER BY nombre`,
  tutores: `SELECT id_encargado AS id, CONCAT(nombres, ' ', apellidos) AS nombre, parentesco, telefono, direccion FROM encargado ORDER BY nombre`,
  encargados: `SELECT id_encargado AS id, CONCAT(nombres, ' ', apellidos) AS nombre, parentesco, telefono, direccion FROM encargado ORDER BY nombre`,
};

const obtenerCatalogo = async (tipo) => {
  if (!Object.hasOwn(catalogos, tipo)) return null;
  const [rows] = await mysqlPool.query(catalogos[tipo]);
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

