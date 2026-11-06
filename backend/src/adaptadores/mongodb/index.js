// Adaptador del Laboratorio Clínico (MongoDB)
const { AppError } = require('../../utils/helpers');
const { Usuario, Paciente, OrdenExamen, CatalogoExamen, Contador } = require('./modelos');
const { vacio, esId, enTransaccion, aPaciente, aAtencion, nuevoExamen } = require('./comun');

const escapar = (texto) => texto.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

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
          resultados: codigos.map((codigo) => nuevoExamen(examenes.find((x) => x.codigo === codigo))),
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
