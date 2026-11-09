const { Timestamp } = require('firebase-admin/firestore');
const { getFirestore } = require('../../../config/firebase');
const { AppError } = require('../../../utils/helpers');

const COLLECTION_NAME = 'odontologos';

/**
 * Validador estricto para el documento Odontólogo
 */
const validateOdontologo = (data, isUpdate = false) => {
  if (!data || typeof data !== 'object') {
    throw new AppError('Los datos del odontólogo deben ser un objeto válido', 400);
  }

  if (!isUpdate || data.colegiado_numero !== undefined) {
    if (!data.colegiado_numero || typeof data.colegiado_numero !== 'string' || !data.colegiado_numero.trim()) {
      throw new AppError('El campo "colegiado_numero" es obligatorio y debe ser String', 400);
    }
  }

  if (!isUpdate || data.nombre_completo !== undefined) {
    if (!data.nombre_completo || typeof data.nombre_completo !== 'string' || !data.nombre_completo.trim()) {
      throw new AppError('El campo "nombre_completo" es obligatorio y debe ser String', 400);
    }
  }

  if (!isUpdate || data.especialidad !== undefined) {
    if (!data.especialidad || typeof data.especialidad !== 'string' || !data.especialidad.trim()) {
      throw new AppError('El campo "especialidad" es obligatorio y debe ser String (Ej. General, Ortodoncia, Endodoncia)', 400);
    }
  }

  if (!isUpdate || data.telefono_contacto !== undefined) {
    if (!data.telefono_contacto || typeof data.telefono_contacto !== 'string' || !data.telefono_contacto.trim()) {
      throw new AppError('El campo "telefono_contacto" es obligatorio y debe ser String', 400);
    }
  }

  const sanitized = {};
  if (data.colegiado_numero !== undefined) sanitized.colegiado_numero = String(data.colegiado_numero).trim();
  if (data.nombre_completo !== undefined) sanitized.nombre_completo = String(data.nombre_completo).trim();
  if (data.especialidad !== undefined) sanitized.especialidad = String(data.especialidad).trim();
  if (data.telefono_contacto !== undefined) sanitized.telefono_contacto = String(data.telefono_contacto).trim();

  return sanitized;
};

const formatDoc = (doc) => {
  if (!doc.exists) return null;
  const data = doc.data();
  return {
    id: doc.id,
    ...data,
    creado_en: data.creado_en?.toDate ? data.creado_en.toDate().toISOString() : data.creado_en,
    actualizado_en: data.actualizado_en?.toDate ? data.actualizado_en.toDate().toISOString() : data.actualizado_en,
  };
};

class OdontologoModel {
  static get collection() {
    const db = getFirestore();
    if (!db) throw new AppError('Firebase Firestore no está inicializado', 503);
    return db.collection(COLLECTION_NAME);
  }

  static async create(data) {
    const validated = validateOdontologo(data);
    validated.creado_en = Timestamp.now();
    validated.actualizado_en = Timestamp.now();

    const docRef = await this.collection.add(validated);
    const createdDoc = await docRef.get();
    return formatDoc(createdDoc);
  }

  static async findById(id) {
    if (!id) throw new AppError('ID de odontólogo requerido', 400);
    const doc = await this.collection.doc(id).get();
    if (!doc.exists) return null;
    return formatDoc(doc);
  }

  static async findByColegiado(colegiado) {
    if (!colegiado) return null;
    const snapshot = await this.collection.where('colegiado_numero', '==', String(colegiado).trim()).limit(1).get();
    if (snapshot.empty) return null;
    return formatDoc(snapshot.docs[0]);
  }

  static async findAll(limit = 100) {
    const snapshot = await this.collection.limit(Number(limit) || 100).get();
    return snapshot.docs.map(formatDoc);
  }

  static async update(id, data) {
    if (!id) throw new AppError('ID de odontólogo requerido', 400);
    const validated = validateOdontologo(data, true);
    validated.actualizado_en = Timestamp.now();

    const docRef = this.collection.doc(id);
    const existing = await docRef.get();
    if (!existing.exists) {
      throw new AppError(`Odontólogo con ID ${id} no encontrado`, 404);
    }

    await docRef.update(validated);
    const updatedDoc = await docRef.get();
    return formatDoc(updatedDoc);
  }
}

module.exports = {
  OdontologoModel,
  validateOdontologo,
  COLLECTION_NAME,
};
