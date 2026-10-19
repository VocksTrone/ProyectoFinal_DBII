const laboratorioService = require('../services/laboratorio.service');
const { asyncHandler, sendSuccess } = require('../../../utils/helpers');

class LaboratorioController {
  getStatus = asyncHandler(async (req, res) => {
    const status = await laboratorioService.getStatus();
    return sendSuccess(res, status, 'Información del módulo Laboratorio Clínico');
  });

  getPacientes = asyncHandler(async (req, res) => {
    const pacientes = await laboratorioService.getAllPacientes();
    return sendSuccess(res, pacientes, 'Lista de pacientes de laboratorio obtenida');
  });

  createPaciente = asyncHandler(async (req, res) => {
    const nuevoPaciente = await laboratorioService.createPaciente(req.body);
    return sendSuccess(res, nuevoPaciente, 'Paciente registrado en laboratorio con éxito', 201);
  });

  getOrdenes = asyncHandler(async (req, res) => {
    const ordenes = await laboratorioService.getAllOrdenes();
    return sendSuccess(res, ordenes, 'Lista de órdenes de examen obtenida');
  });

  createOrden = asyncHandler(async (req, res) => {
    const nuevaOrden = await laboratorioService.createOrden(req.body);
    return sendSuccess(res, nuevaOrden, 'Orden de examen creada con éxito', 201);
  });

  addResultados = asyncHandler(async (req, res) => {
    const { ordenId } = req.params;
    const { resultados } = req.body;
    const ordenActualizada = await laboratorioService.addResultados(ordenId, resultados);
    return sendSuccess(res, ordenActualizada, 'Resultados registrados en la orden con éxito');
  });
}

module.exports = new LaboratorioController();
