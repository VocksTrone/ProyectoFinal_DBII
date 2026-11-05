// Adaptador del Laboratorio Clínico (MongoDB)
const { mongoose } = require('../../config/mongodb');
const { AppError } = require('../../utils/helpers');
const { Usuario, Paciente, OrdenExamen, CatalogoExamen, Contador } = require('./modelos');

const vacio = (v) => (v === undefined || v === null || v === '' ? undefined : v);
const esId = (id) => /^[a-f0-9]{24}$/i.test(String(id));
const soloFecha = (d) => (d ? new Date(d).toISOString().slice(0, 10) : null);
const escapar = (texto) => texto.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

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
      valores: r.valores || {},
      rangos_referencia: r.rangos_referencia || null,
      observaciones: r.observaciones || null,
      laboratorista: r.laboratorista || null,
      fecha_procesamiento: r.fecha_procesamiento || null,
    })),
  },
});

const buscarUsuario = async (usuario) => {
  const u = await Usuario.findOne({ usuario, activo: true }).lean();
  return u ? { id: String(u._id), nombre: u.nombre, rol: u.rol, password_hash: u.password_hash } : null;
};

const buscarPacientes = async (texto) => {
  const filtro = texto
    ? {
        $or: [
          { dpi: texto },
          {
            $expr: {
              $regexMatch: {
                input: { $concat: ['$nombres', ' ', '$apellidos'] },
                regex: escapar(texto),
                options: 'i',
              },
            },
          },
        ],
      }
    : {};
  const pacientes = await Paciente.find(filtro).sort({ apellidos: 1, nombres: 1 }).limit(100).lean();
  return pacientes.map(aPaciente);
};

const crearPaciente = async (d) => {
  const paciente = await Paciente.create({
    dpi: vacio(d.dpi),
    nombres: d.nombres,
    apellidos: d.apellidos,
    fecha_nacimiento: d.fecha_nacimiento,
    sexo: d.sexo,
    contacto: { telefono: vacio(d.telefono), correo: vacio(d.correo) },
    direccion: vacio(d.direccion),
  });
  return aPaciente(paciente.toObject());
};

const obtenerPaciente = async (id) => {
  if (!esId(id)) return null;
  const paciente = await Paciente.findById(id).lean();
  return paciente ? aPaciente(paciente) : null;
};

const obtenerHistorial = async (id) => {
  const paciente = await obtenerPaciente(id);
  if (!paciente) return null;

  const ordenes = await OrdenExamen.find({ paciente_id: id }).sort({ fecha_ingreso: -1 }).lean();
  return { paciente, antecedentes: [], atenciones: ordenes.map(aAtencion) };
};

// Archiva al paciente y cancela sus órdenes pendientes
const archivarPaciente = async (id, motivo) =>
  enTransaccion(async (session) => {
    const paciente = await Paciente.findOneAndUpdate(
      { _id: id, estado: 'activo' },
      { estado: 'archivado', baja: { motivo, fecha: new Date() } },
      { returnDocument: 'after', session }
    ).lean();
    if (!paciente) throw new AppError('El paciente no existe o ya está archivado', 409);

    await OrdenExamen.updateMany({ paciente_id: id, estado: 'pendiente' }, { estado: 'cancelada' }, { session });
    return aPaciente(paciente);
  });

// Atención = nueva orden de examen con sus exámenes pendientes
const registrarAtencion = async (idPaciente, d, usuario) => {
  if (d.receta) throw new AppError('El laboratorio no emite recetas', 400);

  const codigos = d.extra?.examenes;
  if (!Array.isArray(codigos) || codigos.length === 0) {
    throw new AppError('Indique al menos un examen en extra.examenes', 400);
  }
  if (!vacio(d.extra?.medico_solicitante)) {
    throw new AppError('extra.medico_solicitante es obligatorio', 400);
  }

  const orden = await enTransaccion(async (session) => {
    // Marca al paciente: si alguien lo archiva al mismo tiempo, la transacción choca
    const marcado = await Paciente.updateOne(
      { _id: idPaciente, estado: 'activo' },
      { ultima_atencion: new Date() },
      { session }
    );
    if (marcado.matchedCount === 0) throw new AppError('El paciente no existe o está archivado', 409);

    const examenes = await CatalogoExamen.find({ codigo: { $in: codigos } }).session(session).lean();
    const faltan = codigos.filter((c) => !examenes.some((e) => e.codigo === c));
    if (faltan.length) throw new AppError(`Exámenes no encontrados: ${faltan.join(', ')}`, 400);

    // Si algo falla después, el correlativo también se deshace
    const contador = await Contador.findOneAndUpdate(
      { _id: 'ordenes' },
      { $inc: { valor: 1 } },
      { upsert: true, returnDocument: 'after', session }
    );

    const [nueva] = await OrdenExamen.create(
      [
        {
          codigo: `LAB-${String(contador.valor).padStart(6, '0')}`,
          paciente_id: idPaciente,
          medico_solicitante: d.extra.medico_solicitante,
          institucion_origen: vacio(d.extra.institucion_origen),
          motivo: d.motivo,
          notas: vacio(d.notas),
          registrado_por: usuario.nombre,
          resultados: codigos.map((codigo) => {
            const e = examenes.find((x) => x.codigo === codigo);
            return {
              codigo_examen: e.codigo,
              tipo_examen: e.nombre,
              categoria: e.categoria,
              rangos_referencia: e.parametros.map((p) => `${p.nombre}: ${p.rango_referencia}`).join('; '),
            };
          }),
        },
      ],
      { session }
    );
    return nueva;
  });

  return aAtencion(orden.toObject());
};

const obtenerCatalogo = async (tipo) => {
  if (tipo !== 'examenes') return null;
  const examenes = await CatalogoExamen.find().sort({ categoria: 1, nombre: 1 }).lean();
  return examenes.map(({ _id, __v, ...e }) => ({ id: String(_id), ...e }));
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
};
