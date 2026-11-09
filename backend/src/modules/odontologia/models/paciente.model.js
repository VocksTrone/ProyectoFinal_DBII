const { Timestamp, FieldValue } = require('firebase-admin/firestore');
const { getFirestore } = require('../../../config/firebase');
const { AppError } = require('../../../utils/helpers');

const COLLECTION_NAME = 'pacientes';

/**
 * Normaliza cualquier entrada de fecha/timestamp a Firestore Timestamp
 */
const toTimestamp = (dateVal) => {
  if (!dateVal) return Timestamp.now();
  if (dateVal instanceof Timestamp) return dateVal;
  if (dateVal instanceof Date) return Timestamp.fromDate(dateVal);
  if (typeof dateVal === 'string' || typeof dateVal === 'number') {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) {
      throw new AppError(`Fecha inválida: ${dateVal}`, 400);
    }
    return Timestamp.fromDate(d);
  }
  if (dateVal._seconds !== undefined) {
    return new Timestamp(dateVal._seconds, dateVal._nanoseconds || 0);
  }
  return Timestamp.now();
};

/**
 * Validador para subdocumento de historial odontológico
 */
const validateHistorialEntry = (entry) => {
  if (!entry || typeof entry !== 'object') {
    throw new AppError('La entrada de historial odontológico debe ser un objeto válido', 400);
  }
  if (!entry.odontologo_id || typeof entry.odontologo_id !== 'string') {
    throw new AppError('historial_odontologico: odontologo_id es requerido y debe ser String', 400);
  }
  if (!entry.diagnostico || typeof entry.diagnostico !== 'string') {
    throw new AppError('historial_odontologico: diagnostico es requerido y debe ser String', 400);
  }
  if (!entry.tratamiento || typeof entry.tratamiento !== 'string') {
    throw new AppError('historial_odontologico: tratamiento es requerido y debe ser String', 400);
  }

  const odontograma = entry.odontograma && typeof entry.odontograma === 'object' && !Array.isArray(entry.odontograma)
    ? entry.odontograma
    : {};

  return {
    fecha_consulta: toTimestamp(entry.fecha_consulta),
    odontologo_id: entry.odontologo_id.trim(),
    diagnostico: entry.diagnostico.trim(),
    tratamiento: entry.tratamiento.trim(),
    odontograma,
  };
};

/**
 * Validador estricto para el documento Paciente
 */
const validatePaciente = (data, isUpdate = false) => {
  if (!data || typeof data !== 'object') {
    throw new AppError('Los datos del paciente deben ser un objeto válido', 400);
  }

  if (!isUpdate || data.dpi !== undefined) {
    if (!data.dpi || typeof data.dpi !== 'string' || !data.dpi.trim()) {
      throw new AppError('El campo "dpi" es obligatorio y debe ser una cadena de texto no vacía', 400);
    }
  }

  if (!isUpdate || data.nombre !== undefined) {
    if (!data.nombre || typeof data.nombre !== 'string' || !data.nombre.trim()) {
      throw new AppError('El campo "nombre" es obligatorio y debe ser una cadena de texto no vacía', 400);
    }
  }

  // Validación de objeto "contacto"
  const contacto = {};
  if (data.contacto) {
    if (typeof data.contacto !== 'object' || Array.isArray(data.contacto)) {
      throw new AppError('El campo "contacto" debe ser un Map/Objeto con telefono y correo', 400);
    }
    contacto.telefono = data.contacto.telefono ? String(data.contacto.telefono).trim() : '';
    contacto.correo = data.contacto.correo ? String(data.contacto.correo).trim().toLowerCase() : '';
  } else if (!isUpdate) {
    contacto.telefono = '';
    contacto.correo = '';
  }

  // Validación de objeto "contacto_emergencia"
  const contactoEmergencia = {};
  if (data.contacto_emergencia) {
    if (typeof data.contacto_emergencia !== 'object' || Array.isArray(data.contacto_emergencia)) {
      throw new AppError('El campo "contacto_emergencia" debe ser un Map/Objeto con nombre y telefono', 400);
    }
    contactoEmergencia.nombre = data.contacto_emergencia.nombre ? String(data.contacto_emergencia.nombre).trim() : '';
    contactoEmergencia.telefono = data.contacto_emergencia.telefono ? String(data.contacto_emergencia.telefono).trim() : '';
  } else if (!isUpdate) {
    contactoEmergencia.nombre = '';
    contactoEmergencia.telefono = '';
  }

  // Validación de Array "historial_odontologico"
  let historial = [];
  if (data.historial_odontologico !== undefined) {
    if (!Array.isArray(data.historial_odontologico)) {
      throw new AppError('El campo "historial_odontologico" debe ser un Array de subdocumentos', 400);
    }
    historial = data.historial_odontologico.map(validateHistorialEntry);
  }

  const sanitized = {};
  if (data.dpi !== undefined) sanitized.dpi = String(data.dpi).trim();
  if (data.nombre !== undefined) sanitized.nombre = String(data.nombre).trim();
  if (data.contacto !== undefined || !isUpdate) sanitized.contacto = contacto;
  if (data.contacto_emergencia !== undefined || !isUpdate) sanitized.contacto_emergencia = contactoEmergencia;
  if (data.historial_odontologico !== undefined || !isUpdate) sanitized.historial_odontologico = historial;

  return sanitized;
};

/**
 * Convierte un documento de Firestore a JSON plano formateando los Timestamps
 */
const formatDoc = (doc) => {
  if (!doc.exists) return null;
  const data = doc.data();

  const historial = (data.historial_odontologico || []).map((h) => ({
    ...h,
    fecha_consulta: h.fecha_consulta?.toDate ? h.fecha_consulta.toDate().toISOString() : h.fecha_consulta,
  }));

  return {
    id: doc.id,
    ...data,
    historial_odontologico: historial,
    creado_en: data.creado_en?.toDate ? data.creado_en.toDate().toISOString() : data.creado_en,
    actualizado_en: data.actualizado_en?.toDate ? data.actualizado_en.toDate().toISOString() : data.actualizado_en,
  };
};

class PacienteModel {
  static get collection() {
    const db = getFirestore();
    if (!db) throw new AppError('Firebase Firestore no está inicializado', 503);
    return db.collection(COLLECTION_NAME);
  }

  static async create(data) {
    const validated = validatePaciente(data);
    validated.creado_en = Timestamp.now();
    validated.actualizado_en = Timestamp.now();

    const docRef = await this.collection.add(validated);
    const createdDoc = await docRef.get();
    return formatDoc(createdDoc);
  }

  static async findById(id) {
    if (!id) throw new AppError('ID de paciente requerido', 400);
    const doc = await this.collection.doc(id).get();
    if (!doc.exists) return null;
    return formatDoc(doc);
  }

  static async findByDpi(dpi) {
    if (!dpi) return null;
    const snapshot = await this.collection.where('dpi', '==', String(dpi).trim()).limit(1).get();
    if (snapshot.empty) return null;
    return formatDoc(snapshot.docs[0]);
  }

  static async findAll(limit = 100) {
    const snapshot = await this.collection.limit(Number(limit) || 100).get();
    return snapshot.docs.map(formatDoc);
  }

  static async update(id, data) {
    if (!id) throw new AppError('ID de paciente requerido', 400);
    const validated = validatePaciente(data, true);
    validated.actualizado_en = Timestamp.now();

    const docRef = this.collection.doc(id);
    const existing = await docRef.get();
    if (!existing.exists) {
      throw new AppError(`Paciente con ID ${id} no encontrado`, 404);
    }

    await docRef.update(validated);
    const updatedDoc = await docRef.get();
    return formatDoc(updatedDoc);
  }

  /**
   * Agrega un nuevo subdocumento al array de historial_odontologico atómicamente
   */
  static async addHistorialEntry(id, entry) {
    if (!id) throw new AppError('ID de paciente requerido', 400);
    const validatedEntry = validateHistorialEntry(entry);

    const docRef = this.collection.doc(id);
    const existing = await docRef.get();
    if (!existing.exists) {
      throw new AppError(`Paciente con ID ${id} no encontrado`, 404);
    }

    await docRef.update({
      historial_odontologico: FieldValue.arrayUnion(validatedEntry),
      actualizado_en: Timestamp.now(),
    });

    const updatedDoc = await docRef.get();
    return formatDoc(updatedDoc);
  }
}

module.exports = {
  PacienteModel,
  validatePaciente,
  validateHistorialEntry,
  COLLECTION_NAME,
  toTimestamp,
};
