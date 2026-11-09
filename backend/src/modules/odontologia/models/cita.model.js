const { Timestamp } = require('firebase-admin/firestore');
const { getFirestore } = require('../../../config/firebase');
const { AppError } = require('../../../utils/helpers');
const { toTimestamp } = require('./paciente.model');

const COLLECTION_NAME = 'citas';
const ESTADOS_VALIDOS = ['Pendiente', 'Confirmada', 'Atendida', 'Cancelada'];

/**
 * Validador estricto para el documento Cita
 */
const validateCita = (data, isUpdate = false) => {
  if (!data || typeof data !== 'object') {
    throw new AppError('Los datos de la cita deben ser un objeto válido', 400);
  }

  if (!isUpdate || data.paciente_id !== undefined) {
    if (!data.paciente_id || typeof data.paciente_id !== 'string' || !data.paciente_id.trim()) {
      throw new AppError('El campo "paciente_id" es obligatorio y debe ser String de referencia al paciente', 400);
    }
  }

  if (!isUpdate || data.odontologo_id !== undefined) {
    if (!data.odontologo_id || typeof data.odontologo_id !== 'string' || !data.odontologo_id.trim()) {
      throw new AppError('El campo "odontologo_id" es obligatorio y debe ser String de referencia al odontólogo', 400);
    }
  }

  if (!isUpdate || data.fecha_hora !== undefined) {
    if (!data.fecha_hora) {
      throw new AppError('El campo "fecha_hora" es obligatorio (Timestamp / Date / ISO string)', 400);
    }
  }

  if (!isUpdate || data.motivo !== undefined) {
    if (!data.motivo || typeof data.motivo !== 'string' || !data.motivo.trim()) {
      throw new AppError('El campo "motivo" es obligatorio y debe ser String', 400);
    }
  }

  if (data.estado !== undefined) {
    if (!ESTADOS_VALIDOS.includes(data.estado)) {
      throw new AppError(
        `Estado de cita inválido: "${data.estado}". Valores permitidos: ${ESTADOS_VALIDOS.join(', ')}`,
        400
      );
    }
  }

  const sanitized = {};
  if (data.paciente_id !== undefined) sanitized.paciente_id = String(data.paciente_id).trim();
  if (data.odontologo_id !== undefined) sanitized.odontologo_id = String(data.odontologo_id).trim();
  if (data.fecha_hora !== undefined) sanitized.fecha_hora = toTimestamp(data.fecha_hora);
  if (data.motivo !== undefined) sanitized.motivo = String(data.motivo).trim();
  if (data.estado !== undefined) {
    sanitized.estado = data.estado;
  } else if (!isUpdate) {
    sanitized.estado = 'Pendiente';
  }
  if (data.notas_secretaria !== undefined) {
    sanitized.notas_secretaria = String(data.notas_secretaria).trim();
  } else if (!isUpdate) {
    sanitized.notas_secretaria = '';
  }

  return sanitized;
};

const formatDoc = (doc) => {
  if (!doc.exists) return null;
  const data = doc.data();
  return {
    id: doc.id,
    ...data,
    fecha_hora: data.fecha_hora?.toDate ? data.fecha_hora.toDate().toISOString() : data.fecha_hora,
    creado_en: data.creado_en?.toDate ? data.creado_en.toDate().toISOString() : data.creado_en,
    actualizado_en: data.actualizado_en?.toDate ? data.actualizado_en.toDate().toISOString() : data.actualizado_en,
  };
};

class CitaModel {
  static get collection() {
    const db = getFirestore();
    if (!db) throw new AppError('Firebase Firestore no está inicializado', 503);
    return db.collection(COLLECTION_NAME);
  }

  static async create(data) {
    const validated = validateCita(data);
    validated.creado_en = Timestamp.now();
    validated.actualizado_en = Timestamp.now();

    const docRef = await this.collection.add(validated);
    const createdDoc = await docRef.get();
    return formatDoc(createdDoc);
  }

  static async findById(id) {
    if (!id) throw new AppError('ID de cita requerido', 400);
    const doc = await this.collection.doc(id).get();
    if (!doc.exists) return null;
    return formatDoc(doc);
  }

  static async findAll({ paciente_id, odontologo_id, estado, limit = 50 } = {}) {
    let query = this.collection;

    if (paciente_id) query = query.where('paciente_id', '==', String(paciente_id).trim());
    if (odontologo_id) query = query.where('odontologo_id', '==', String(odontologo_id).trim());
    if (estado) query = query.where('estado', '==', estado);

    query = query.limit(Number(limit) || 50);
    const snapshot = await query.get();
    return snapshot.docs.map(formatDoc);
  }

  static async update(id, data) {
    if (!id) throw new AppError('ID de cita requerido', 400);
    const validated = validateCita(data, true);
    validated.actualizado_en = Timestamp.now();

    const docRef = this.collection.doc(id);
    const existing = await docRef.get();
    if (!existing.exists) {
      throw new AppError(`Cita con ID ${id} no encontrada`, 404);
    }

    await docRef.update(validated);
    const updatedDoc = await docRef.get();
    return formatDoc(updatedDoc);
  }

  static async updateEstado(id, nuevoEstado) {
    if (!ESTADOS_VALIDOS.includes(nuevoEstado)) {
      throw new AppError(
        `Estado inválido: "${nuevoEstado}". Permitidos: ${ESTADOS_VALIDOS.join(', ')}`,
        400
      );
    }
    return this.update(id, { estado: nuevoEstado });
  }
}

module.exports = {
  CitaModel,
  validateCita,
  ESTADOS_VALIDOS,
  COLLECTION_NAME,
};
