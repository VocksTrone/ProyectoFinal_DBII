const authService = require('../core/auth.service');
const pacientesService = require('../core/pacientes.service');
const { instituciones, obtenerAdaptador } = require('../adaptadores');
const { generateToken } = require('../middlewares/auth');
const { asyncHandler, sendSuccess, AppError } = require('../utils/helpers');

class ComunController {
  login = asyncHandler(async (req, res) => {
    const { usuario, institucion } = authService.separarUsuario(req.body.usuario);

    if (!instituciones.includes(institucion)) {
      throw new AppError(`Institución desconocida: ${institucion}`, 400);
    }
    const adaptador = obtenerAdaptador(institucion);
    if (!adaptador) throw new AppError(`La institución "${institucion}" aún no está disponible`, 503);

    const datos = await authService.login(adaptador, { usuario, institucion, password: req.body.password });
    return sendSuccess(res, { token: generateToken(datos), usuario: datos }, 'Sesión iniciada');
  });

  buscarPacientes = asyncHandler(async (req, res) => {
    const data = await pacientesService.buscar(req.adaptador, req.query.buscar);
    return sendSuccess(res, data, 'Pacientes obtenidos');
  });

  crearPaciente = asyncHandler(async (req, res) => {
    const data = await pacientesService.crear(req.adaptador, req.body);
    return sendSuccess(res, data, 'Paciente registrado', 201);
  });

  obtenerPaciente = asyncHandler(async (req, res) => {
    const data = await pacientesService.obtener(req.adaptador, req.params.id);
    return sendSuccess(res, data, 'Paciente obtenido');
  });

  obtenerHistorial = asyncHandler(async (req, res) => {
    const data = await pacientesService.historial(req.adaptador, req.params.id);
    return sendSuccess(res, data, 'Historial obtenido');
  });

  archivarPaciente = asyncHandler(async (req, res) => {
    const data = await pacientesService.archivar(req.adaptador, req.params.id, req.body.motivo);
    return sendSuccess(res, data, 'Paciente archivado');
  });

  registrarAtencion = asyncHandler(async (req, res) => {
    const data = await pacientesService.registrarAtencion(req.adaptador, req.params.id, req.body, req.user);
    return sendSuccess(res, data, 'Atención registrada', 201);
  });

  obtenerCatalogo = asyncHandler(async (req, res) => {
    const data = await pacientesService.catalogo(req.adaptador, req.params.tipo);
    return sendSuccess(res, data, 'Catálogo obtenido');
  });
}

module.exports = new ComunController();
