// =====================================================================
// Utilidades compartidas del adaptador MySQL (Centro Médico Pediátrico)
// =====================================================================

const { mysqlPool } = require('../../config/mysql');
const { AppError } = require('../../utils/helpers');

const vacio = (v) => (v === undefined || v === null || v === '' ? null : v);
const esId = (id) => /^\d+$/.test(String(id));

const aFecha = (v) => {
  if (!v) return null;
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  return String(v).slice(0, 10);
};

// Ejecuta una función dentro de una transacción en MySQL
const enTransaccion = async (fn) => {
  const conn = await mysqlPool.getConnection();
  try {
    await conn.beginTransaction();
    const resultado = await fn(conn);
    await conn.commit();
    return resultado;
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
};

// Obtiene el id_medico del usuario en sesión
const medicoDeUsuario = async (conn, usuario) => {
  const [rows] = await conn.query('SELECT id_medico FROM usuario WHERE id_usuario = ?', [usuario.id]);
  if (!rows[0]?.id_medico) {
    throw new AppError('El usuario no está vinculado a un médico pediatra', 403);
  }
  return rows[0].id_medico;
};

// Bloquea al paciente para transacciones concurrentes y verifica estado activo
const bloquearPacienteActivo = async (conn, idPaciente) => {
  const [rows] = await conn.query(
    'SELECT estado FROM paciente WHERE id_paciente = ? FOR UPDATE',
    [idPaciente]
  );
  if (!rows[0]) throw new AppError('Paciente pediátrico no encontrado', 404);
  if (rows[0].estado !== 'activo') throw new AppError('El paciente está archivado', 409);
};

// Transforma la fila de base de datos al formato estándar del contrato de la API
const aPaciente = (f) => ({
  id: String(f.id_paciente),
  dpi: f.dpi || null,
  nombres: f.nombres,
  apellidos: f.apellidos,
  fecha_nacimiento: aFecha(f.fecha_nacimiento),
  sexo: f.sexo,
  telefono: f.telefono || null,
  correo: f.correo || null,
  direccion: f.direccion || null,
  estado: f.estado,
  extra: {
    tipo_sangre: f.tipo_sangre || null,
    fecha_registro: aFecha(f.fecha_registro),
    motivo_baja: f.motivo_baja || null,
    fecha_baja: aFecha(f.fecha_baja),
    id_encargado: f.id_encargado ? String(f.id_encargado) : null,
    ...(f.encargado_nombres
      ? {
          encargado: {
            id: String(f.id_encargado),
            nombres: f.encargado_nombres,
            apellidos: f.encargado_apellidos,
            parentesco: f.encargado_parentesco,
            telefono: f.encargado_telefono,
            direccion: f.encargado_direccion,
            correo: f.encargado_correo,
            dpi: f.encargado_dpi,
          },
        }
      : {}),
  },
});

module.exports = {
  vacio,
  esId,
  aFecha,
  enTransaccion,
  medicoDeUsuario,
  bloquearPacienteActivo,
  aPaciente,
};

