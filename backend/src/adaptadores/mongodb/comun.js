// Utilidades compartidas del adaptador MongoDB
const { mongoose } = require('../../config/mongodb');

const vacio = (v) => (v === undefined || v === null || v === '' ? undefined : v);
const esId = (id) => /^[a-f0-9]{24}$/i.test(String(id));
const soloFecha = (d) => (d ? new Date(d).toISOString().slice(0, 10) : null);

// Ejecuta fn dentro de una transacción: todo o nada
const enTransaccion = async (fn) => {
  const session = await mongoose.startSession();
  try {
    let resultado;
    await session.withTransaction(async () => {
      resultado = await fn(session);
    });
    return resultado;
  } finally {
    await session.endSession();
  }
};

// Documento -> formato del contrato
const aPaciente = (p) => ({
  id: String(p._id),
  dpi: p.dpi || null,
  nombres: p.nombres,
  apellidos: p.apellidos,
  fecha_nacimiento: soloFecha(p.fecha_nacimiento),
  sexo: p.sexo,
  telefono: p.contacto?.telefono || null,
  correo: p.contacto?.correo || null,
  direccion: p.direccion || null,
  estado: p.estado,
  extra: {
    fecha_registro: soloFecha(p.createdAt),
    motivo_baja: p.baja?.motivo || null,
    fecha_baja: soloFecha(p.baja?.fecha),
  },
});

// Orden de examen -> atención del contrato
const aAtencion = (o) => ({
  id: String(o._id),
  fecha: new Date(o.fecha_ingreso).toISOString(),
  profesional: o.medico_solicitante,
  motivo: o.motivo || null,
  notas: o.notas || null,
  diagnosticos: [],
  receta: null,
  extra: {
    codigo: o.codigo,
    estado: o.estado,
    institucion_origen: o.institucion_origen || null,
    registrado_por: o.registrado_por || null,
    examenes: (o.resultados || []).map((r) => ({
      id: String(r._id),
      codigo_examen: r.codigo_examen,
      tipo_examen: r.tipo_examen,
      categoria: r.categoria,
      estado: r.estado,
      valores: r.valores instanceof Map ? Object.fromEntries(r.valores) : r.valores || {},
      rangos_referencia: r.rangos_referencia || null,
      observaciones: r.observaciones || null,
      laboratorista: r.laboratorista || null,
      fecha_procesamiento: r.fecha_procesamiento || null,
    })),
  },
});

// Examen del catálogo -> examen pendiente dentro de la orden
const nuevoExamen = (e) => ({
  codigo_examen: e.codigo,
  tipo_examen: e.nombre,
  categoria: e.categoria,
  rangos_referencia: e.parametros.map((p) => `${p.nombre}: ${p.rango_referencia}`).join('; '),
});

module.exports = {
  vacio,
  esId,
  soloFecha,
  enTransaccion,
  aPaciente,
  aAtencion,
  nuevoExamen,
};
