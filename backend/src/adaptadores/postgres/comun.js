// Utilidades compartidas del adaptador PostgreSQL
const { pgPool } = require('../../config/postgres');
const { AppError } = require('../../utils/helpers');

// Fecha/hora actual en Guatemala (el servidor de Supabase está en UTC)
const AHORA = "(now() at time zone 'America/Guatemala')";

const vacio = (v) => (v === undefined || v === '' ? null : v);
const esId = (id) => /^\d+$/.test(String(id));

// Ejecuta fn dentro de una transacción: todo o nada
const enTransaccion = async (fn) => {
  const db = await pgPool.connect();
  try {
    await db.query('begin');
    const resultado = await fn(db);
    await db.query('commit');
    return resultado;
  } catch (error) {
    await db.query('rollback');
    throw error;
  } finally {
    db.release();
  }
};

// id_medico del usuario que inició sesión
const medicoDeUsuario = async (db, usuario) => {
  const { rows } = await db.query('select id_medico from hospital_general.usuario where id_usuario = $1', [usuario.id]);
  if (!rows[0]?.id_medico) throw new AppError('El usuario no está vinculado a un médico', 403);
  return rows[0].id_medico;
};

// Bloquea al paciente y revisa que esté activo
const bloquearPacienteActivo = async (db, idPaciente) => {
  const { rows } = await db.query(
    'select estado from hospital_general.paciente where id_paciente = $1 for update',
    [idPaciente]
  );
  if (!rows[0]) throw new AppError('Paciente no encontrado', 404);
  if (rows[0].estado !== 'activo') throw new AppError('El paciente está archivado', 409);
};

module.exports = {
  AHORA,
  vacio,
  esId,
  enTransaccion,
  medicoDeUsuario,
  bloquearPacienteActivo,
};
