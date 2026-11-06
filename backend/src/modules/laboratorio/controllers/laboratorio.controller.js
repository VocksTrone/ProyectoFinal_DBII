const laboratorio = require('../../../adaptadores/mongodb/laboratorio');
const { validar, esObjeto } = require('../../../core/validaciones');
const { asyncHandler, sendSuccess, AppError } = require('../../../utils/helpers');

const ESTADOS = ['pendiente', 'en_proceso', 'completada', 'cancelada'];

// La secretaria ve la orden, pero no los valores (información restringida)
const sinValores = (orden) => ({
  ...orden,
  extra: {
    ...orden.extra,
    examenes: orden.extra.examenes.map(({ valores, observaciones, ...e }) => e),
  },
});

class LaboratorioController {
  listarOrdenes = asyncHandler(async (req, res) => {
    const { estado } = req.query;
    validar([[!estado || ESTADOS.includes(estado), 'estado', ESTADOS.join(', ')]]);

    const ordenes = await laboratorio.listarOrdenes({ estado });
    const data = req.user.rol === 'medico' ? ordenes : ordenes.map(sinValores);
    return sendSuccess(res, data, 'Órdenes obtenidas');
  });

  obtenerOrden = asyncHandler(async (req, res) => {
    const data = await laboratorio.obtenerOrden(req.params.id);
    if (!data) throw new AppError('Orden no encontrada', 404);
    return sendSuccess(res, data, 'Reporte de la orden');
  });

  agregarExamenes = asyncHandler(async (req, res) => {
    const { examenes } = req.body;
    validar([
      [Array.isArray(examenes) && examenes.length > 0, 'examenes', 'Lista de códigos del catálogo'],
      [Array.isArray(examenes) && examenes.every((c) => typeof c === 'string'), 'examenes', 'Los códigos deben ser texto'],
    ]);
    const data = await laboratorio.agregarExamenes(req.params.id, examenes);
    const respuesta = req.user.rol === 'medico' ? data : sinValores(data);
    return sendSuccess(res, respuesta, 'Exámenes agregados a la orden');
  });

  registrarResultado = asyncHandler(async (req, res) => {
    validar([[esObjeto(req.body.valores), 'valores', 'Objeto { parámetro: valor }']]);
    const data = await laboratorio.registrarResultado(req.params.id, req.params.idExamen, req.body, req.user);
    return sendSuccess(res, data, 'Resultado registrado y validado');
  });
}

module.exports = new LaboratorioController();
