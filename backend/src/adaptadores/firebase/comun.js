const { AppError } = require('../../utils/helpers');

const vacio = (v) => (v === undefined || v === null || v === '' ? null : v);
const esId = (id) => typeof id === 'string' && id.trim().length > 0;

const aFecha = (v) => {
  if (!v) return null;
  if (typeof v === 'object' && v !== null) {
    if (typeof v.toDate === 'function') {
      return v.toDate().toISOString().slice(0, 10);
    }
    if (v instanceof Date) {
      return v.toISOString().slice(0, 10);
    }
    if (v._seconds !== undefined) {
      return new Date(v._seconds * 1000).toISOString().slice(0, 10);
    }
  }
  return String(v).slice(0, 10);
};

// Documento de Firestore -> paciente del contrato
const aPaciente = (p) => {
  if (!p) return null;

  let nombres = p.nombres || '';
  let apellidos = p.apellidos || '';

  if (!nombres && p.nombre) {
    const partes = String(p.nombre).trim().split(' ');
    if (partes.length > 2) {
      nombres = partes.slice(0, -2).join(' ');
      apellidos = partes.slice(-2).join(' ');
    } else if (partes.length === 2) {
      nombres = partes[0];
      apellidos = partes[1];
    } else {
      nombres = partes[0] || 'Paciente';
      apellidos = 'Odontológico';
    }
  }

  const telefono = p.telefono || p.contacto?.telefono || null;
  const correo = p.correo || p.contacto?.correo || null;

  return {
    id: String(p.id || p._id),
    dpi: p.dpi ? String(p.dpi) : null,
    nombres: nombres.trim(),
    apellidos: apellidos.trim(),
    fecha_nacimiento: aFecha(p.fecha_nacimiento) || '1995-01-01',
    sexo: p.sexo || 'M',
    telefono: vacio(telefono),
    correo: vacio(correo),
    direccion: vacio(p.direccion),
    estado: p.estado || 'activo',
    extra: {
      fecha_registro: aFecha(p.creado_en || p.fecha_registro || p.createdAt) || '2026-01-10',
      motivo_baja: p.motivo_baja || p.baja?.motivo || null,
      fecha_baja: aFecha(p.fecha_baja || p.baja?.fecha),
      contacto_emergencia: p.contacto_emergencia || null,
      odontograma_actual: p.odontograma_actual || null,
    },
  };
};

// Registro del historial -> atención del contrato
const aAtencion = (entry, odontologos = []) => {
  const profesionalObj = odontologos.find((o) => o.id === entry.odontologo_id);
  const nombreProfesional = entry.profesional || (profesionalObj ? profesionalObj.nombre_completo : 'Dra. Carmen García');

  const fechaStr = aFecha(entry.fecha_consulta || entry.fecha) || new Date().toISOString().slice(0, 10);

  const diagnosticos = Array.isArray(entry.diagnosticos) && entry.diagnosticos.length > 0
    ? entry.diagnosticos
    : [
        {
          id: `${entry.id || 'at'}-dx1`,
          nombre: entry.diagnostico || 'Evaluación odontológica general',
          tipo: entry.tipo_diagnostico || 'definitivo',
          codigo: entry.codigo_cie10 || 'K02.1',
          descripcion: entry.descripcion || entry.diagnostico || 'Caries dentinaria / Lesión periodontal evaluada',
          fecha: fechaStr,
          tratamientos: [
            {
              id: `${entry.id || 'at'}-tx1`,
              descripcion: entry.tratamiento || 'Procedimiento odontológico realizado',
              duracion_dias: entry.duracion_dias || 1,
              fecha_inicio: fechaStr,
              fecha_fin: fechaStr,
            },
          ],
        },
      ];

  return {
    id: String(entry.id),
    fecha: fechaStr,
    profesional: nombreProfesional,
    motivo: entry.motivo || entry.diagnostico || 'Consulta odontológica programada',
    notas: entry.notas || '',
    diagnosticos,
    receta: entry.receta || null,
    extra: {
      odontologo_id: entry.odontologo_id || (profesionalObj ? profesionalObj.id : 'od_1'),
      colegiado: profesionalObj?.colegiado_numero || 'OD-10452',
      odontograma: entry.odontograma || {},
      cita_id: entry.cita_id || null,
    },
  };
};

const HASH_ODONTOLOGIA = '$2b$10$ldY9FVamybYHQqzgHq9/6eCvDOhpXS7wIy6UkfAL.NF31rEdGYRkm';

const USUARIOS_INICIALES = [
  {
    id: 'usr_od_1',
    usuario: 'cgarcia',
    nombre: 'Dra. Carmen García',
    rol: 'medico',
    password_hash: HASH_ODONTOLOGIA,
    id_odontologo: 'od_1',
    activo: true,
  },
  {
    id: 'usr_od_2',
    usuario: 'dlopez',
    nombre: 'Dr. Daniel López',
    rol: 'medico',
    password_hash: HASH_ODONTOLOGIA,
    id_odontologo: 'od_2',
    activo: true,
  },
  {
    id: 'usr_od_3',
    usuario: 'mramirez',
    nombre: 'Marta Ramírez',
    rol: 'secretaria',
    password_hash: HASH_ODONTOLOGIA,
    id_odontologo: null,
    activo: true,
  },
];

const ODONTOLOGOS_INICIALES = [
  {
    id: 'od_1',
    colegiado_numero: 'OD-10452',
    nombre_completo: 'Dra. Carmen García',
    especialidad: 'Odontología General',
    telefono_contacto: '55511223',
    correo: 'cgarcia@odontologia.gt',
  },
  {
    id: 'od_2',
    colegiado_numero: 'OD-08914',
    nombre_completo: 'Dr. Daniel López',
    especialidad: 'Ortodoncia y Endodoncia',
    telefono_contacto: '55544556',
    correo: 'dlopez@odontologia.gt',
  },
];

const PACIENTES_INICIALES = [
  {
    id: 'pac_od_001',
    dpi: '2589631470101',
    nombres: 'Valeria Sofía',
    apellidos: 'Morales Cifuentes',
    fecha_nacimiento: '1998-04-12',
    sexo: 'F',
    telefono: '41258963',
    correo: 'valeria.morales@gmail.com',
    direccion: '12 Calle 4-50 Zona 1, Quetzaltenango',
    estado: 'activo',
    contacto: { telefono: '41258963', correo: 'valeria.morales@gmail.com' },
    contacto_emergencia: { nombre: 'Carlos Morales', telefono: '55231478' },
    creado_en: '2026-01-15T09:00:00.000Z',
    odontograma_actual: {
      '16': { estado: 'obturado', cara: 'oclusal', material: 'resina' },
      '26': { estado: 'sano' },
    },
    historial_odontologico: [
      {
        id: 'hist_od_101',
        fecha_consulta: '2026-10-15',
        odontologo_id: 'od_1',
        profesional: 'Dra. Carmen García',
        motivo: 'Dolor punzante en molar superior derecho al masticar',
        notas: 'Se observa cavidad oclusal profunda en pieza 16. Se aplica anestesia local y aislamiento absoluto.',
        diagnostico: 'Caries dentinaria profunda en pieza 16',
        codigo_cie10: 'K02.1',
        tratamiento: 'Obturación estética con resina fotocurable y colocación de base cavitaria de ionómero de vidrio',
        duracion_dias: 1,
        odontograma: {
          '16': { estado: 'obturado', cara: 'oclusal', material: 'resina' },
        },
      },
      {
        id: 'hist_od_102',
        fecha_consulta: '2026-11-02',
        odontologo_id: 'od_1',
        profesional: 'Dra. Carmen García',
        motivo: 'Control post-obturación y profilaxis preventiva',
        notas: 'Pieza 16 en óptimas condiciones, contacto oclusal ajustado. Se realiza destartraje ultrasónico supragingival.',
        diagnostico: 'Gingivitis marginal inducida por biopelícula dental',
        codigo_cie10: 'K05.1',
        tratamiento: 'Profilaxis dental completa con ultrasonido, pulido coronario y aplicación tópica de flúor barniz',
        duracion_dias: 1,
        odontograma: {
          '16': { estado: 'obturado_satisfactorio' },
          'general': { sarro: 'removido', encias: 'leves signos de sangrado' },
        },
      },
    ],
  },
  {
    id: 'pac_od_002',
    dpi: '1987456320901',
    nombres: 'Eduardo José',
    apellidos: 'Alvarado Méndez',
    fecha_nacimiento: '1992-09-28',
    sexo: 'M',
    telefono: '58963214',
    correo: 'e.alvarado@correo.gt',
    direccion: '7a Avenida 8-30 Zona 3, Quetzaltenango',
    estado: 'activo',
    contacto: { telefono: '58963214', correo: 'e.alvarado@correo.gt' },
    contacto_emergencia: { nombre: 'Lorena Méndez', telefono: '47852369' },
    creado_en: '2026-02-10T10:30:00.000Z',
    odontograma_actual: {
      arcada_superior: { aparatologia: 'brackets_ceramicos' },
      arcada_inferior: { aparatologia: 'brackets_ceramicos' },
    },
    historial_odontologico: [
      {
        id: 'hist_od_103',
        fecha_consulta: '2026-09-20',
        odontologo_id: 'od_2',
        profesional: 'Dr. Daniel López',
        motivo: 'Evaluación ortodóntica y corrección de apiñamiento severo',
        notas: 'Apiñamiento anteroinferior severo con sobremordida aumentada. Se toman modelos de estudio y fotografías.',
        diagnostico: 'Maloclusión Clase II esquelética y dental con apiñamiento moderado-severo',
        codigo_cie10: 'K07.2',
        tratamiento: 'Instalación de aparatología fija (brackets cerámicos prescripción Roth .022) en ambas arcadas',
        duracion_dias: 365,
        odontograma: {
          arcada_superior: { aparatologia: 'brackets_ceramicos', arco: '.014 NiTi' },
          arcada_inferior: { aparatologia: 'brackets_ceramicos', arco: '.014 NiTi' },
        },
      },
    ],
  },
  {
    id: 'pac_od_003',
    dpi: '3012458790101',
    nombres: 'Camila Lucía',
    apellidos: 'Fuentes Barrios',
    fecha_nacimiento: '2005-02-14',
    sexo: 'F',
    telefono: '52147896',
    correo: 'camila.fuentes@yahoo.com',
    direccion: 'Colonia Las Rosas, Lote 14 Zona 5, Quetzaltenango',
    estado: 'activo',
    contacto: { telefono: '52147896', correo: 'camila.fuentes@yahoo.com' },
    contacto_emergencia: { nombre: 'Rodrigo Fuentes', telefono: '56987412' },
    creado_en: '2026-03-01T14:15:00.000Z',
    odontograma_actual: {
      '38': { estado: 'semi_impactado', pericoronaritis: true },
      '48': { estado: 'impactado' },
    },
    historial_odontologico: [
      {
        id: 'hist_od_104',
        fecha_consulta: '2026-10-05',
        odontologo_id: 'od_1',
        profesional: 'Dra. Carmen García',
        motivo: 'Dolor e inflamación aguda en zona retromolar inferior izquierda con dificultad para tragar',
        notas: 'Erupción parcial de tercer molar pieza 38 con opérculo inflamado y exudado seropurulento leve.',
        diagnostico: 'Pericoronaritis aguda recurrente en tercer molar inferior semi-retenido (pieza 38)',
        codigo_cie10: 'K05.2',
        tratamiento: 'Irrigación con clorhexidina 0.12%, antibioticoterapia oral y programación de exodoncia quirúrgica',
        duracion_dias: 7,
        odontograma: {
          '38': { estado: 'semi_impactado', indicacion: 'cirugia' },
        },
      },
    ],
  },
];

const CATALOGOS_ODONTOLOGIA = {
  tratamientos: [
    { id: 'tx_od_1', nombre: 'Obturación dental con resina estética fotocurable', codigo: 'OD-RES', costo: 250, categoria: 'Operatoria Dental' },
    { id: 'tx_od_2', nombre: 'Profilaxis dental completa y destartraje ultrasónico', codigo: 'OD-PROF', costo: 200, categoria: 'Periodoncia' },
    { id: 'tx_od_3', nombre: 'Endodoncia unirradicular (Conductos en pieza anterior o premolar)', codigo: 'OD-ENDO1', costo: 750, categoria: 'Endodoncia' },
    { id: 'tx_od_4', nombre: 'Endodoncia multirradicular (Tratamiento de conductos en molar)', codigo: 'OD-ENDO2', costo: 1100, categoria: 'Endodoncia' },
    { id: 'tx_od_5', nombre: 'Exodoncia dental simple de pieza permanente', codigo: 'OD-EXO1', costo: 175, categoria: 'Cirugía Oral' },
    { id: 'tx_od_6', nombre: 'Exodoncia quirúrgica compleja de tercer molar impactado (cordal)', codigo: 'OD-CORD', costo: 650, categoria: 'Cirugía Oral' },
    { id: 'tx_od_7', nombre: 'Blanqueamiento dental profesional en consultorio (Luz LED)', codigo: 'OD-BLANQ', costo: 950, categoria: 'Estética Dental' },
    { id: 'tx_od_8', nombre: 'Aplicación tópica de flúor barniz preventivo', codigo: 'OD-FLUOR', costo: 120, categoria: 'Odontología Preventiva' },
    { id: 'tx_od_9', nombre: 'Sellantes de fosas y fisuras por pieza dental', codigo: 'OD-SELL', costo: 100, categoria: 'Odontología Preventiva' },
    { id: 'tx_od_10', nombre: 'Control, cambio de arcos y ajuste mensual de ortodoncia', codigo: 'OD-ORTO-AJ', costo: 250, categoria: 'Ortodoncia' },
    { id: 'tx_od_11', nombre: 'Corona de porcelana libre de metal sobre estructura de Zirconio', codigo: 'OD-COR-ZIR', costo: 1800, categoria: 'Prótesis Fija' },
  ],
  odontologos: ODONTOLOGOS_INICIALES.map((o) => ({
    id: o.id,
    nombre: o.nombre_completo,
    colegiado: o.colegiado_numero,
    especialidad: o.especialidad,
    telefono: o.telefono_contacto,
  })),
  especialidades: [
    { id: 'esp_1', nombre: 'Odontología General Integral' },
    { id: 'esp_2', nombre: 'Endodoncia y Microcirugía Apical' },
    { id: 'esp_3', nombre: 'Ortodoncia y Ortopedia Dentofacial' },
    { id: 'esp_4', nombre: 'Periodoncia e Implantología Quirúrgica' },
    { id: 'esp_5', nombre: 'Cirugía Oral y Maxilofacial' },
    { id: 'esp_6', nombre: 'Odontopediatría' },
    { id: 'esp_7', nombre: 'Rehabilitación Oral y Prótesis Dental' },
  ],
  medicamentos: [
    { id: 'med_od_1', nombre: 'Amoxicilina 500 mg', presentacion: 'Cápsulas', concentracion: '500 mg' },
    { id: 'med_od_2', nombre: 'Ibuprofeno 600 mg', presentacion: 'Tabletas recubiertas', concentracion: '600 mg' },
    { id: 'med_od_3', nombre: 'Ketorolaco trometamina 10 mg', presentacion: 'Tabletas sublinguales', concentracion: '10 mg' },
    { id: 'med_od_4', nombre: 'Clorhexidina solución bucal 0.12%', presentacion: 'Frasco 250 ml', concentracion: '0.12%' },
    { id: 'med_od_5', nombre: 'Amoxicilina + Ácido Clavulánico 875/125 mg', presentacion: 'Tabletas', concentracion: '875/125 mg' },
    { id: 'med_od_6', nombre: 'Acetaminofén (Paracetamol) 500 mg', presentacion: 'Tabletas', concentracion: '500 mg' },
  ],
};

module.exports = {
  vacio,
  esId,
  aFecha,
  aPaciente,
  aAtencion,
  USUARIOS_INICIALES,
  ODONTOLOGOS_INICIALES,
  PACIENTES_INICIALES,
  CATALOGOS_ODONTOLOGIA,
};

