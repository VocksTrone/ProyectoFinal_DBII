const { Timestamp } = require('firebase-admin/firestore');
const { getFirestore } = require('../../../config/firebase');
const { AppError } = require('../../../utils/helpers');
const { toTimestamp } = require('./paciente.model');

const COLLECTION_NAME = 'pagos';

const ESTADOS_PAGO = ['Completado', 'Pendiente', 'Parcial'];
const METODOS_PAGO = ['Efectivo', 'Tarjeta', 'Transferencia'];

const validateDesgloseItem = (item, index = 0) => {
  if (!item || typeof item !== 'object') {
    throw new AppError(`desglose_pago[${index}]: Debe ser un objeto válido`, 400);
  }

  if (!item.metodo || !METODOS_PAGO.includes(item.metodo)) {
    throw new AppError(
      `desglose_pago[${index}].metodo inválido: "${item.metodo}". Valores permitidos: ${METODOS_PAGO.join(', ')}`,
      400
    );
  }

  const monto = Number(item.monto);
  if (isNaN(monto) || monto <= 0) {
    throw new AppError(`desglose_pago[${index}].monto debe ser un número mayor a 0`, 400);
  }

  const referencia = item.referencia !== undefined && item.referencia !== null
    ? String(item.referencia).trim()
    : '';

  return {
    metodo: item.metodo,
    monto: Number(monto.toFixed(2)),
    referencia,
  };
};

const validateHonorariosMedicos = (honorarios, totalAtencion) => {
  if (!honorarios || typeof honorarios !== 'object' || Array.isArray(honorarios)) {
    throw new AppError('El campo "honorarios_medicos" debe ser un Map/Subdocumento con odontologo_id y porcentaje_honorario', 400);
  }

  if (!honorarios.odontologo_id || typeof honorarios.odontologo_id !== 'string' || !honorarios.odontologo_id.trim()) {
    throw new AppError('honorarios_medicos.odontologo_id es obligatorio y debe ser String de referencia al odontólogo', 400);
  }

  const porcentaje = Number(honorarios.porcentaje_honorario);
  if (isNaN(porcentaje) || porcentaje < 0 || porcentaje > 100) {
    throw new AppError('honorarios_medicos.porcentaje_honorario debe ser un número entre 0 y 100 (Ej. 40)', 400);
  }

  // El honorario se calcula sobre total_atencion
  const montoCalculado = Number(((totalAtencion * porcentaje) / 100).toFixed(2));

  return {
    odontologo_id: honorarios.odontologo_id.trim(),
    porcentaje_honorario: porcentaje,
    monto_honorario: montoCalculado,
  };
};

const validatePago = (data, isUpdate = false) => {
  if (!data || typeof data !== 'object') {
    throw new AppError('Los datos del pago deben ser un objeto válido', 400);
  }

  if (!isUpdate || data.paciente_id !== undefined) {
    if (!data.paciente_id || typeof data.paciente_id !== 'string' || !data.paciente_id.trim()) {
      throw new AppError('El campo "paciente_id" es obligatorio y debe ser String de referencia al paciente', 400);
    }
  }

  if (!isUpdate || data.cita_id !== undefined) {
    if (!data.cita_id || typeof data.cita_id !== 'string' || !data.cita_id.trim()) {
      throw new AppError('El campo "cita_id" es obligatorio y debe ser String de referencia a la cita', 400);
    }
  }

  if (!isUpdate || data.total_atencion !== undefined) {
    const total = Number(data.total_atencion);
    if (isNaN(total) || total <= 0) {
      throw new AppError('El campo "total_atencion" es obligatorio y debe ser un número mayor a 0', 400);
    }
  }

  if (data.estado_pago !== undefined) {
    if (!ESTADOS_PAGO.includes(data.estado_pago)) {
      throw new AppError(
        `estado_pago inválido: "${data.estado_pago}". Valores permitidos: ${ESTADOS_PAGO.join(', ')}`,
        400
      );
    }
  }

  const totalAtencion = data.total_atencion !== undefined ? Number(Number(data.total_atencion).toFixed(2)) : undefined;

  // Pagos mixtos: efectivo, tarjeta y transferencia
  let desglose = [];
  if (data.desglose_pago !== undefined) {
    if (!Array.isArray(data.desglose_pago)) {
      throw new AppError('El campo "desglose_pago" debe ser un Array de subdocumentos', 400);
    }
    desglose = data.desglose_pago.map(validateDesgloseItem);
  }

  const estado = data.estado_pago || (!isUpdate ? 'Completado' : undefined);

  // El desglose tiene que sumar el total
  if (totalAtencion !== undefined && desglose.length > 0 && estado) {
    const totalPagadoDesglose = Number(
      desglose.reduce((sum, item) => sum + item.monto, 0).toFixed(2)
    );

    if (estado === 'Completado' && Math.abs(totalPagadoDesglose - totalAtencion) > 0.05) {
      throw new AppError(
        `Para estado_pago "Completado", la suma del desglose mixto (Q${totalPagadoDesglose}) debe igualar el total de la atención (Q${totalAtencion})`,
        400
      );
    }

    if (estado === 'Parcial' && totalPagadoDesglose >= totalAtencion) {
      throw new AppError(
        `Para estado_pago "Parcial", la suma pagada (Q${totalPagadoDesglose}) debe ser menor al total (Q${totalAtencion})`,
        400
      );
    }
  }

  let honorarios = undefined;
  if (data.honorarios_medicos !== undefined) {
    const baseTotal = totalAtencion !== undefined ? totalAtencion : (data.total_atencion || 0);
    honorarios = validateHonorariosMedicos(data.honorarios_medicos, baseTotal);
  } else if (!isUpdate) {
    throw new AppError('El campo "honorarios_medicos" es obligatorio con odontologo_id y porcentaje_honorario', 400);
  }

  const sanitized = {};
  if (data.paciente_id !== undefined) sanitized.paciente_id = String(data.paciente_id).trim();
  if (data.cita_id !== undefined) sanitized.cita_id = String(data.cita_id).trim();
  if (data.fecha_pago !== undefined) {
    sanitized.fecha_pago = toTimestamp(data.fecha_pago);
  } else if (!isUpdate) {
    sanitized.fecha_pago = Timestamp.now();
  }
  if (totalAtencion !== undefined) sanitized.total_atencion = totalAtencion;
  if (estado !== undefined) sanitized.estado_pago = estado;
  if (data.desglose_pago !== undefined || !isUpdate) sanitized.desglose_pago = desglose;
  if (honorarios !== undefined) sanitized.honorarios_medicos = honorarios;

  return sanitized;
};

const formatDoc = (doc) => {
  if (!doc.exists) return null;
  const data = doc.data();
  return {
    id: doc.id,
    ...data,
    fecha_pago: data.fecha_pago?.toDate ? data.fecha_pago.toDate().toISOString() : data.fecha_pago,
    creado_en: data.creado_en?.toDate ? data.creado_en.toDate().toISOString() : data.creado_en,
    actualizado_en: data.actualizado_en?.toDate ? data.actualizado_en.toDate().toISOString() : data.actualizado_en,
  };
};

class PagoModel {
  static get collection() {
    const db = getFirestore();
    if (!db) throw new AppError('Firebase Firestore no está inicializado', 503);
    return db.collection(COLLECTION_NAME);
  }

  static async create(data) {
    const validated = validatePago(data);
    validated.creado_en = Timestamp.now();
    validated.actualizado_en = Timestamp.now();

    const docRef = await this.collection.add(validated);
    const createdDoc = await docRef.get();
    return formatDoc(createdDoc);
  }

  static async findById(id) {
    if (!id) throw new AppError('ID de pago requerido', 400);
    const doc = await this.collection.doc(id).get();
    if (!doc.exists) return null;
    return formatDoc(doc);
  }

  static async findByCitaId(citaId) {
    if (!citaId) return [];
    const snapshot = await this.collection.where('cita_id', '==', String(citaId).trim()).get();
    return snapshot.docs.map(formatDoc);
  }

  static async findByPacienteId(pacienteId) {
    if (!pacienteId) return [];
    const snapshot = await this.collection.where('paciente_id', '==', String(pacienteId).trim()).get();
    return snapshot.docs.map(formatDoc);
  }

  static async findAll({ paciente_id, cita_id, estado_pago, limit = 50 } = {}) {
    let query = this.collection;
    if (paciente_id) query = query.where('paciente_id', '==', String(paciente_id).trim());
    if (cita_id) query = query.where('cita_id', '==', String(cita_id).trim());
    if (estado_pago) query = query.where('estado_pago', '==', estado_pago);

    query = query.limit(Number(limit) || 50);
    const snapshot = await query.get();
    return snapshot.docs.map(formatDoc);
  }

  static async update(id, data) {
    if (!id) throw new AppError('ID de pago requerido', 400);
    const validated = validatePago(data, true);
    validated.actualizado_en = Timestamp.now();

    const docRef = this.collection.doc(id);
    const existing = await docRef.get();
    if (!existing.exists) {
      throw new AppError(`Pago con ID ${id} no encontrado`, 404);
    }

    await docRef.update(validated);
    const updatedDoc = await docRef.get();
    return formatDoc(updatedDoc);
  }
}

module.exports = {
  PagoModel,
  validatePago,
  validateDesgloseItem,
  validateHonorariosMedicos,
  ESTADOS_PAGO,
  METODOS_PAGO,
  COLLECTION_NAME,
};
