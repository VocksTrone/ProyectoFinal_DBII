// =====================================================================
// Adaptador de la Clínica Odontológica (Firebase Firestore)
// Implementa el contrato común de la API para persistencia en Firestore
// con almacenamiento resiliente y soporte para operaciones clínicas odontológicas.
// =====================================================================

const { getFirestore } = require('../../config/firebase');
const { AppError } = require('../../utils/helpers');
const {
  vacio,
  esId,
  aFecha,
  aPaciente,
  aAtencion,
  USUARIOS_INICIALES,
  ODONTOLOGOS_INICIALES,
  PACIENTES_INICIALES,
  CATALOGOS_ODONTOLOGIA,
} = require('./comun');

// Estado en memoria compartido durante la ejecución del proceso
// Se sincroniza con Firestore cuando las credenciales y red están activas
const memoria = {
  usuarios: [...USUARIOS_INICIALES],
  odontologos: [...ODONTOLOGOS_INICIALES],
  pacientes: JSON.parse(JSON.stringify(PACIENTES_INICIALES)),
};

// =====================================================================
// Mecanismo de Circuit Breaker y Timeout para Firestore
// =====================================================================
let firestoreHabilitado = true;

const conTimeout = (promesa, ms = 600) => {
  return Promise.race([
    promesa,
    new Promise((_, reject) => setTimeout(() => reject(new Error('Firestore timeout')), ms)),
  ]);
};

const ejecutarFirestore = async (fn) => {
  if (!firestoreHabilitado) return null;
  try {
    const db = getFirestore();
    if (!db) return null;
    return await conTimeout(fn(db), 600);
  } catch (err) {
    // Si da error de autenticación, timeout o conexión, desactivar llamadas subsecuentes
    firestoreHabilitado = false;
    return null;
  }
};

// =====================================================================
// FUNCIONES DEL CONTRATO COMÚN DE LA API
// =====================================================================

/**
 * 1. Buscar usuario para login (@odontologia)
 * @param {string} usuario Nombre de usuario sin @odontologia (ej. "cgarcia", "mramirez", "dlopez")
 * @returns {Promise<{ id: string, nombre: string, rol: string, password_hash: string } | null>}
 */
const buscarUsuario = async (usuario) => {
  const norm = String(usuario || '').trim().toLowerCase();
  if (!norm) return null;

  // Intenta consulta en Firestore si está disponible
  const firestoreUser = await ejecutarFirestore(async (db) => {
    const snap = await db.collection('usuarios').where('usuario', '==', norm).where('activo', '==', true).limit(1).get();
    if (!snap.empty) {
      const doc = snap.docs[0];
      const data = doc.data();
      return {
        id: String(doc.id),
        nombre: data.nombre,
        rol: data.rol,
        password_hash: data.password_hash,
        id_odontologo: data.id_odontologo || null,
      };
    }
    return null;
  });

  if (firestoreUser) return firestoreUser;

  // Búsqueda en almacén de memoria
  const u = memoria.usuarios.find((x) => x.usuario.toLowerCase() === norm && x.activo);
  if (!u) return null;

  return {
    id: String(u.id),
    nombre: u.nombre,
    rol: u.rol,
    password_hash: u.password_hash,
    id_odontologo: u.id_odontologo || null,
  };
};

/**
 * 2. Buscar pacientes (por texto o DPI/CUI)
 * @param {string} texto Cadena de búsqueda (DPI o nombre)
 * @returns {Promise<Array>} Lista de pacientes en formato de contrato
 */
const buscarPacientes = async (texto) => {
  const t = String(texto || '').trim().toLowerCase();

  const firestorePacientes = await ejecutarFirestore(async (db) => {
    let snap;
    if (t) {
      snap = await db.collection('pacientes').where('dpi', '==', t).limit(50).get();
    } else {
      snap = await db.collection('pacientes').limit(100).get();
    }
    if (!snap.empty) {
      return snap.docs.map((d) => aPaciente({ id: d.id, ...d.data() }));
    }
    return null;
  });

  if (firestorePacientes && firestorePacientes.length > 0) {
    return firestorePacientes;
  }

  const filtrados = memoria.pacientes.filter((p) => {
    if (!t) return true;
    const dpi = String(p.dpi || '').toLowerCase();
    const nombreCompleto = `${p.nombres || ''} ${p.apellidos || ''}`.toLowerCase();
    return dpi.includes(t) || nombreCompleto.includes(t);
  });

  return filtrados.map(aPaciente);
};

/**
 * 3. Crear nuevo paciente odontológico
 * @param {Object} d Datos del paciente (nombres, apellidos, dpi, fecha_nacimiento, sexo, etc.)
 * @returns {Promise<Object>} Paciente registrado en formato de contrato
 */
const crearPaciente = async (d) => {
  const dpiVal = vacio(d.dpi ? String(d.dpi).trim() : null);

  // Validación de duplicado por DPI
  if (dpiVal) {
    const existenteMem = memoria.pacientes.find((p) => p.dpi === dpiVal);
    if (existenteMem) {
      throw new AppError(`Ya existe un paciente con el DPI ${dpiVal}`, 409);
    }
  }

  const idNuevo = `pac_od_${Date.now()}`;
  const hoyIso = new Date().toISOString();

  const nuevo = {
    id: idNuevo,
    dpi: dpiVal,
    nombres: d.nombres.trim(),
    apellidos: d.apellidos.trim(),
    fecha_nacimiento: d.fecha_nacimiento,
    sexo: d.sexo,
    telefono: vacio(d.telefono),
    correo: vacio(d.correo),
    direccion: vacio(d.direccion),
    estado: 'activo',
    contacto: {
      telefono: vacio(d.telefono) || '',
      correo: vacio(d.correo) || '',
    },
    contacto_emergencia: d.extra?.contacto_emergencia || {
      nombre: '',
      telefono: '',
    },
    creado_en: hoyIso,
    actualizado_en: hoyIso,
    odontograma_actual: d.extra?.odontograma_actual || {},
    historial_odontologico: [],
  };

  // Intenta persistir en Firestore de forma no bloqueante
  await ejecutarFirestore(async (db) => {
    const docRef = await db.collection('pacientes').add(nuevo);
    nuevo.id = docRef.id;
  });

  memoria.pacientes.unshift(nuevo);
  return aPaciente(nuevo);
};

/**
 * 4. Obtener paciente por ID
 * @param {string} id ID del paciente
 * @returns {Promise<Object|null>}
 */
const obtenerPaciente = async (id) => {
  if (!esId(id)) return null;

  const firestorePaciente = await ejecutarFirestore(async (db) => {
    const doc = await db.collection('pacientes').doc(id).get();
    if (doc.exists) {
      return aPaciente({ id: doc.id, ...doc.data() });
    }
    return null;
  });

  if (firestorePaciente) return firestorePaciente;

  const p = memoria.pacientes.find((x) => x.id === id);
  return p ? aPaciente(p) : null;
};

/**
 * 5. Obtener historial clínico odontológico completo
 * @param {string} id ID del paciente
 * @returns {Promise<Object|null>}
 */
const obtenerHistorial = async (id) => {
  const paciente = await obtenerPaciente(id);
  if (!paciente) return null;

  let rawPaciente = memoria.pacientes.find((x) => x.id === id);

  const firestoreHistorial = await ejecutarFirestore(async (db) => {
    const doc = await db.collection('pacientes').doc(id).get();
    if (doc.exists) {
      return { id: doc.id, ...doc.data() };
    }
    return null;
  });

  if (firestoreHistorial) {
    rawPaciente = firestoreHistorial;
  }

  const historialRaw = rawPaciente?.historial_odontologico || [];
  const atenciones = historialRaw.map((entry) => aAtencion(entry, memoria.odontologos));

  // Orden descendente por fecha (más reciente primero)
  atenciones.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

  return {
    paciente,
    antecedentes: [],
    atenciones,
    extra: {
      odontograma: rawPaciente?.odontograma_actual || {},
      profesionales: memoria.odontologos,
    },
  };
};

/**
 * 6. Archivar o desactivar historial clínico del paciente odontológico
 * @param {string} id ID del paciente
 * @param {string} motivo Justificación de la baja
 * @returns {Promise<Object>} Paciente archivado
 */
const archivarPaciente = async (id, motivo) => {
  const p = memoria.pacientes.find((x) => x.id === id);
  if (!p || p.estado === 'archivado') {
    throw new AppError('El paciente no existe o ya está archivado', 409);
  }

  const fechaBaja = new Date().toISOString().slice(0, 10);
  p.estado = 'archivado';
  p.motivo_baja = motivo;
  p.fecha_baja = fechaBaja;

  await ejecutarFirestore(async (db) => {
    await db.collection('pacientes').doc(id).update({
      estado: 'archivado',
      motivo_baja: motivo,
      fecha_baja: fechaBaja,
    });
  });

  return aPaciente(p);
};

/**
 * 7. Registrar atención odontológica (consulta, diagnósticos, tratamientos y odontograma)
 * @param {string} idPaciente ID del paciente
 * @param {Object} d Datos de la atención (motivo, notas, diagnosticos, receta, extra)
 * @param {Object} usuario Usuario autenticado que registra
 * @returns {Promise<Object>} Atención registrada
 */
const registrarAtencion = async (idPaciente, d, usuario) => {
  const paciente = memoria.pacientes.find((x) => x.id === idPaciente);
  if (!paciente) {
    throw new AppError('Paciente odontológico no encontrado', 404);
  }
  if (paciente.estado === 'archivado') {
    throw new AppError('El paciente está archivado', 409);
  }

  // Determinar odontólogo responsable
  let odontologo = null;
  if (usuario?.id_odontologo) {
    odontologo = memoria.odontologos.find((o) => o.id === usuario.id_odontologo);
  } else if (d.extra?.odontologo_id) {
    odontologo = memoria.odontologos.find((o) => o.id === d.extra.odontologo_id);
  }
  if (!odontologo) {
    odontologo = memoria.odontologos[0]; // Por defecto: Dra. Carmen García
  }

  const idAtencion = `hist_od_${Date.now()}`;
  const hoyStr = new Date().toISOString().slice(0, 10);

  const primerDiag = Array.isArray(d.diagnosticos) && d.diagnosticos.length > 0 ? d.diagnosticos[0] : null;
  const primerTx = primerDiag?.tratamientos?.[0];

  const nuevaEntrada = {
    id: idAtencion,
    fecha_consulta: hoyStr,
    odontologo_id: odontologo.id,
    profesional: odontologo.nombre_completo,
    motivo: d.motivo.trim(),
    notas: vacio(d.notas) || '',
    diagnostico: primerDiag?.nombre || d.motivo.trim(),
    codigo_cie10: primerDiag?.codigo || 'K02.1',
    tratamiento: primerTx?.descripcion || 'Tratamiento odontológico integral',
    duracion_dias: primerTx?.duracion_dias || 1,
    diagnosticos: d.diagnosticos || [],
    receta: d.receta || null,
    odontograma: d.extra?.odontograma || {},
  };

  // Si trae cambios de odontograma, se actualiza el odontograma actual del paciente
  if (d.extra?.odontograma && typeof d.extra.odontograma === 'object') {
    paciente.odontograma_actual = {
      ...(paciente.odontograma_actual || {}),
      ...d.extra.odontograma,
    };
  }

  if (!Array.isArray(paciente.historial_odontologico)) {
    paciente.historial_odontologico = [];
  }
  paciente.historial_odontologico.push(nuevaEntrada);

  await ejecutarFirestore(async (db) => {
    await db.collection('pacientes').doc(idPaciente).update({
      odontograma_actual: paciente.odontograma_actual,
      historial_odontologico: paciente.historial_odontologico,
      actualizado_en: new Date().toISOString(),
    });
  });

  return aAtencion(nuevaEntrada, memoria.odontologos);
};

/**
 * 8. Catálogos comunes y específicos de odontología
 * @param {string} tipo Nombre del catálogo ('tratamientos', 'odontologos', 'especialidades', 'medicamentos')
 * @returns {Promise<Array|null>}
 */
const obtenerCatalogo = async (tipo) => {
  const norm = String(tipo || '').toLowerCase();
  if (!Object.hasOwn(CATALOGOS_ODONTOLOGIA, norm)) {
    return null;
  }
  return CATALOGOS_ODONTOLOGIA[norm];
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
  memoria,
};
