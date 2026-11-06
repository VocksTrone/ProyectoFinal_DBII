// Funciones propias del Laboratorio Clínico (MongoDB)
const { AppError } = require('../../utils/helpers');
const { OrdenExamen, CatalogoExamen } = require('./modelos');
const { vacio, esId, enTransaccion, aPaciente, aAtencion, nuevoExamen } = require('./comun');

const ESTADOS_ABIERTOS = ['pendiente', 'en_proceso'];

// Lista de trabajo: por defecto, órdenes sin terminar (las más antiguas primero)
const listarOrdenes = async ({ estado }) => {
  const filtro = estado ? { estado } : { estado: { $in: ESTADOS_ABIERTOS } };
  const ordenes = await OrdenExamen.find(filtro)
    .sort({ fecha_ingreso: 1 })
    .limit(200)
    .populate('paciente_id', 'nombres apellidos dpi')
    .lean();

  return ordenes.map((o) => ({
    ...aAtencion(o),
    paciente: o.paciente_id
      ? { id: String(o.paciente_id._id), nombre: `${o.paciente_id.nombres} ${o.paciente_id.apellidos}`, dpi: o.paciente_id.dpi || null }
      : null,
  }));
};

// Reporte: orden + paciente + parámetros de cada examen
const obtenerOrden = async (id) => {
  if (!esId(id)) return null;
  const orden = await OrdenExamen.findById(id).populate('paciente_id').lean();
  if (!orden) return null;

  const catalogo = await CatalogoExamen.find({
    codigo: { $in: orden.resultados.map((r) => r.codigo_examen) },
  }).lean();

  const atencion = aAtencion(orden);
  atencion.extra.examenes = atencion.extra.examenes.map((e) => ({
    ...e,
    parametros: catalogo.find((c) => c.codigo === e.codigo_examen)?.parametros || [],
  }));

  return { ...atencion, paciente: orden.paciente_id ? aPaciente(orden.paciente_id) : null };
};

// Busca la orden dentro de la transacción y revisa que siga abierta
const ordenAbierta = async (id, session) => {
  const orden = esId(id) ? await OrdenExamen.findById(id).session(session) : null;
  if (!orden) throw new AppError('Orden no encontrada', 404);
  if (!ESTADOS_ABIERTOS.includes(orden.estado)) throw new AppError(`La orden está ${orden.estado}`, 409);
  return orden;
};

const agregarExamenes = async (id, codigos) =>
  enTransaccion(async (session) => {
    const orden = await ordenAbierta(id, session);
    const unicos = [...new Set(codigos)];

    const repetidos = unicos.filter((c) => orden.resultados.some((r) => r.codigo_examen === c));
    if (repetidos.length) throw new AppError(`Ya están en la orden: ${repetidos.join(', ')}`, 409);

    const examenes = await CatalogoExamen.find({ codigo: { $in: unicos } }).session(session).lean();
    const faltan = unicos.filter((c) => !examenes.some((e) => e.codigo === c));
    if (faltan.length) throw new AppError(`Exámenes no encontrados: ${faltan.join(', ')}`, 400);

    unicos.forEach((c) => orden.resultados.push(nuevoExamen(examenes.find((e) => e.codigo === c))));
    await orden.save({ session });
    return aAtencion(orden.toObject());
  });

// Guarda y valida el resultado de un examen; los valores deben calzar con su catálogo
const registrarResultado = async (idOrden, idExamen, { valores, observaciones }, usuario) =>
  enTransaccion(async (session) => {
    const orden = await ordenAbierta(idOrden, session);

    const examen = esId(idExamen) ? orden.resultados.id(idExamen) : null;
    if (!examen) throw new AppError('Examen no encontrado en la orden', 404);
    if (examen.estado === 'validado') throw new AppError('El resultado ya fue validado y no se puede modificar', 409);

    const tipo = await CatalogoExamen.findOne({ codigo: examen.codigo_examen }).session(session).lean();
    const esperados = (tipo?.parametros || []).map((p) => p.nombre);
    const recibidos = Object.keys(valores);

    const errores = [
      ...esperados
        .filter((p) => !Object.hasOwn(valores, p) || vacio(valores[p]) === undefined)
        .map((p) => ({ field: `valores.${p}`, message: 'Falta este parámetro' })),
      ...recibidos
        .filter((p) => !esperados.includes(p))
        .map((p) => ({ field: `valores.${p}`, message: `No es parámetro de ${examen.tipo_examen}` })),
    ];
    if (errores.length) throw new AppError('Los valores no corresponden al examen', 400, errores);

    examen.valores = valores;
    examen.observaciones = vacio(observaciones);
    examen.laboratorista = usuario.nombre;
    examen.fecha_procesamiento = new Date();
    examen.estado = 'validado';

    // Completa la orden cuando todos sus exámenes están validados
    orden.estado = orden.resultados.every((r) => r.estado === 'validado') ? 'completada' : 'en_proceso';
    await orden.save({ session });
    return aAtencion(orden.toObject());
  });

module.exports = {
  listarOrdenes,
  obtenerOrden,
  agregarExamenes,
  registrarResultado,
};
