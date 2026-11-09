const { mysqlPool } = require('../../config/mysql');
const { AppError } = require('../../utils/helpers');
const {
  vacio,
  esId,
  aFecha,
  enTransaccion,
  medicoDeUsuario,
  bloquearPacienteActivo,
} = require('./comun');


const aTutor = (f) => ({
  id: String(f.id_encargado),
  nombres: f.nombres,
  apellidos: f.apellidos,
  nombre_completo: `${f.nombres} ${f.apellidos}`.trim(),
  parentesco: f.parentesco,
  telefono: f.telefono,
  direccion: f.direccion || null,
  correo: f.correo || null,
  dpi: f.dpi || null,
});

const listarTutores = async (busqueda = '') => {
  const t = vacio(busqueda) || '';
  const [rows] = await mysqlPool.query(
    `SELECT * FROM encargado
     WHERE ? = '' OR dpi = ? OR CONCAT(nombres, ' ', apellidos) LIKE CONCAT('%', ?, '%')
     ORDER BY apellidos, nombres
     LIMIT 100`,
    [t, t, t]
  );
  return rows.map(aTutor);
};

const obtenerTutor = async (id) => {
  if (!esId(id)) return null;
  const [rows] = await mysqlPool.query('SELECT * FROM encargado WHERE id_encargado = ?', [id]);
  if (!rows[0]) return null;

  const [pacientes] = await mysqlPool.query(
    `SELECT id_paciente, nombres, apellidos, fecha_nacimiento, sexo, estado
     FROM paciente WHERE id_encargado = ? ORDER BY apellidos, nombres`,
    [id]
  );

  return {
    ...aTutor(rows[0]),
    pacientes: pacientes.map((p) => ({
      id: String(p.id_paciente),
      nombres: p.nombres,
      apellidos: p.apellidos,
      fecha_nacimiento: aFecha(p.fecha_nacimiento),
      sexo: p.sexo,
      estado: p.estado,
    })),
  };
};

const crearTutor = async (d) => {
  const [res] = await mysqlPool.query(
    `INSERT INTO encargado (nombres, apellidos, parentesco, telefono, direccion, correo, dpi)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      d.nombres.trim(),
      d.apellidos.trim(),
      d.parentesco.trim(),
      d.telefono.trim(),
      vacio(d.direccion),
      vacio(d.correo),
      vacio(d.dpi),
    ]
  );
  return aTutor({ id_encargado: res.insertId, ...d });
};


const registrarControlCrecimiento = async (idPaciente, d) =>
  enTransaccion(async (conn) => {
    await bloquearPacienteActivo(conn, idPaciente);

    // Sin edad en meses, se calcula con la fecha de nacimiento
    let edadMeses = d.edad_meses;
    if (edadMeses === undefined || edadMeses === null) {
      const [p] = await conn.query('SELECT fecha_nacimiento FROM paciente WHERE id_paciente = ?', [idPaciente]);
      if (p[0]?.fecha_nacimiento) {
        const nac = new Date(p[0].fecha_nacimiento);
        const ref = d.fecha ? new Date(d.fecha) : new Date();
        edadMeses = Math.max(0, (ref.getFullYear() - nac.getFullYear()) * 12 + (ref.getMonth() - nac.getMonth()));
      } else {
        edadMeses = 0;
      }
    }

    const [res] = await conn.query(
      `INSERT INTO controlcrecimiento
         (id_paciente, fecha, peso, talla, perimetro_cefalico, edad_meses, observaciones)
       VALUES (?, COALESCE(?, CURRENT_DATE()), ?, ?, ?, ?, ?)`,
      [
        idPaciente,
        vacio(d.fecha),
        d.peso_kg !== undefined ? d.peso_kg : d.peso,
        d.talla_cm !== undefined ? d.talla_cm : d.talla,
        d.perimetro_cefalico_cm !== undefined ? d.perimetro_cefalico_cm : vacio(d.perimetro_cefalico),
        edadMeses,
        vacio(d.observaciones),
      ]
    );

    const [filas] = await conn.query('SELECT * FROM controlcrecimiento WHERE id_control = ?', [res.insertId]);
    const c = filas[0];
    return {
      id: String(c.id_control),
      id_paciente: String(c.id_paciente),
      fecha: aFecha(c.fecha),
      peso: Number(c.peso),
      talla: Number(c.talla),
      perimetro_cefalico: c.perimetro_cefalico ? Number(c.perimetro_cefalico) : null,
      edad_meses: c.edad_meses,
      observaciones: c.observaciones,
    };
  });

const obtenerControlesCrecimiento = async (idPaciente) => {
  if (!esId(idPaciente)) return [];
  const [rows] = await mysqlPool.query(
    `SELECT * FROM controlcrecimiento
     WHERE id_paciente = ?
     ORDER BY fecha ASC, edad_meses ASC`,
    [idPaciente]
  );
  return rows.map((c) => ({
    id: String(c.id_control),
    id_paciente: String(c.id_paciente),
    fecha: aFecha(c.fecha),
    peso: Number(c.peso),
    talla: Number(c.talla),
    perimetro_cefalico: c.perimetro_cefalico ? Number(c.perimetro_cefalico) : null,
    edad_meses: c.edad_meses,
    observaciones: c.observaciones,
  }));
};


const listarVacunas = async () => {
  const [rows] = await mysqlPool.query('SELECT * FROM vacuna ORDER BY nombre');
  return rows.map((v) => ({
    id: String(v.id_vacuna),
    nombre: v.nombre,
    enfermedad_previene: v.enfermedad_previene,
    dosis_requeridas: v.dosis_requeridas,
  }));
};

const registrarVacunacion = async (idPaciente, d, usuario) =>
  enTransaccion(async (conn) => {
    await bloquearPacienteActivo(conn, idPaciente);

    let idMedico = null;
    if (usuario && usuario.rol === 'medico') {
      try {
        idMedico = await medicoDeUsuario(conn, usuario);
      } catch {
        idMedico = null;
      }
    }

    // Sin número de dosis, sigue a la última registrada
    let numDosis = d.numero_dosis;
    if (!numDosis) {
      const [previas] = await conn.query(
        'SELECT COUNT(*) AS total FROM registrovacunacion WHERE id_paciente = ? AND id_vacuna = ?',
        [idPaciente, d.id_vacuna]
      );
      numDosis = (previas[0]?.total || 0) + 1;
    }

    const [res] = await conn.query(
      `INSERT INTO registrovacunacion
         (id_paciente, id_vacuna, numero_dosis, fecha_aplicacion, proxima_fecha, lote, id_medico, observaciones)
       VALUES (?, ?, ?, COALESCE(?, CURRENT_DATE()), ?, ?, ?, ?)`,
      [
        idPaciente,
        d.id_vacuna,
        numDosis,
        vacio(d.fecha_aplicacion),
        vacio(d.proxima_fecha),
        vacio(d.lote),
        idMedico,
        vacio(d.observaciones),
      ]
    );

    const [filas] = await conn.query(
      `SELECT r.*, v.nombre AS vacuna, v.enfermedad_previene, v.dosis_requeridas,
              CONCAT(m.nombres, ' ', m.apellidos) AS profesional
       FROM registrovacunacion r
       JOIN vacuna v ON v.id_vacuna = r.id_vacuna
       LEFT JOIN medico m ON m.id_medico = r.id_medico
       WHERE r.id_registro = ?`,
      [res.insertId]
    );

    const r = filas[0];
    return {
      id: String(r.id_registro),
      id_paciente: String(r.id_paciente),
      id_vacuna: String(r.id_vacuna),
      vacuna: r.vacuna,
      enfermedad_previene: r.enfermedad_previene,
      numero_dosis: r.numero_dosis,
      dosis_requeridas: r.dosis_requeridas,
      fecha_aplicacion: aFecha(r.fecha_aplicacion),
      proxima_fecha: aFecha(r.proxima_fecha),
      lote: r.lote,
      profesional: r.profesional,
      observaciones: r.observaciones,
    };
  });

const obtenerEsquemaVacunacion = async (idPaciente) => {
  if (!esId(idPaciente)) return null;

  const [vacunas] = await mysqlPool.query('SELECT * FROM vacuna ORDER BY id_vacuna');
  const [aplicaciones] = await mysqlPool.query(
    `SELECT r.*, CONCAT(m.nombres, ' ', m.apellidos) AS profesional
     FROM registrovacunacion r
     LEFT JOIN medico m ON m.id_medico = r.id_medico
     WHERE r.id_paciente = ?
     ORDER BY r.id_vacuna, r.numero_dosis`,
    [idPaciente]
  );

  return vacunas.map((v) => {
    const dosisAplicadas = aplicaciones.filter((a) => a.id_vacuna === v.id_vacuna);
    const completadas = dosisAplicadas.length;
    const pendiente = completadas < v.dosis_requeridas;
    const ultima = dosisAplicadas[dosisAplicadas.length - 1];

    return {
      id_vacuna: String(v.id_vacuna),
      vacuna: v.nombre,
      enfermedad_previene: v.enfermedad_previene,
      dosis_requeridas: v.dosis_requeridas,
      dosis_completadas: completadas,
      completo: completadas >= v.dosis_requeridas,
      pendiente,
      proxima_dosis: pendiente ? completadas + 1 : null,
      proxima_fecha: ultima?.proxima_fecha ? aFecha(ultima.proxima_fecha) : null,
      aplicaciones: dosisAplicadas.map((a) => ({
        id: String(a.id_registro),
        numero_dosis: a.numero_dosis,
        fecha_aplicacion: aFecha(a.fecha_aplicacion),
        proxima_fecha: aFecha(a.proxima_fecha),
        lote: a.lote,
        profesional: a.profesional,
        observaciones: a.observaciones,
      })),
    };
  });
};

module.exports = {
  listarTutores,
  obtenerTutor,
  crearTutor,
  registrarControlCrecimiento,
  obtenerControlesCrecimiento,
  listarVacunas,
  registrarVacunacion,
  obtenerEsquemaVacunacion,
};

