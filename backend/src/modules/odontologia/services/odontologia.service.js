const { getFirestore, isFirebaseReady } = require('../../../config/firebase');
const { AppError } = require('../../../utils/helpers');

class OdontologiaService {
  /**
   * Verificar estado del módulo y conexión a Firestore
   */
  async getStatus() {
    return {
      institution: 'Clínica Odontológica',
      engine: 'Firebase Firestore (NoSQL Documental)',
      status: isFirebaseReady() ? 'connected' : 'pending_credentials',
      collections: ['pacientes (con historial_odontologico embebido)', 'citas', 'odontologos'],
      description: 'Módulo de tratamientos dentales, citas y fichas clínicas odontológicas',
    };
  }

  /**
   * Obtener colección de pacientes
   */
  async getAllPacientes() {
    const db = getFirestore();
    if (!db) {
      throw new AppError('Firebase Firestore no está inicializado o configurado', 503);
    }
    const snapshot = await db.collection('pacientes').limit(100).get();
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  }

  /**
   * Crear paciente con historial odontológico embebido
   */
  async createPaciente(data) {
    const db = getFirestore();
    if (!db) {
      throw new AppError('Firebase Firestore no está inicializado o configurado', 503);
    }

    const pacienteData = {
      cui: data.cui,
      nombre: data.nombre,
      apellidos: data.apellidos,
      telefono: data.telefono || null,
      email: data.email || null,
      fecha_creacion: new Date().toISOString(),
      // Patrón embebido: historial odontológico dentro del paciente
      historial_odontologico: data.historial_odontologico || {
        alergias_anestesia: false,
        enfermedades_periodontales: false,
        intervenciones_previas: [],
        odontograma: [],
      },
    };

    const docRef = await db.collection('pacientes').add(pacienteData);
    return { id: docRef.id, ...pacienteData };
  }

  /**
   * Registrar cita odontológica (Patrón referenciado a paciente y odontólogo)
   */
  async createCita(data) {
    const db = getFirestore();
    if (!db) {
      throw new AppError('Firebase Firestore no está inicializado o configurado', 503);
    }

    const citaData = {
      paciente_id: data.paciente_id,
      odontologo_id: data.odontologo_id,
      fecha_hora: data.fecha_hora,
      motivo_consulta: data.motivo_consulta,
      tratamiento_propuesto: data.tratamiento_propuesto || '',
      estado: data.estado || 'programada', // programada, realizada, cancelada
      costo_estimado: data.costo_estimado || 0,
      creado_en: new Date().toISOString(),
    };

    const docRef = await db.collection('citas').add(citaData);
    return { id: docRef.id, ...citaData };
  }

  /**
   * Listar citas
   */
  async getAllCitas() {
    const db = getFirestore();
    if (!db) {
      throw new AppError('Firebase Firestore no está inicializado o configurado', 503);
    }
    const snapshot = await db.collection('citas').orderBy('creado_en', 'desc').limit(50).get();
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  }
}

module.exports = new OdontologiaService();
