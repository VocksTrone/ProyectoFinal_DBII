const pediatriaService = require('../services/pediatria.service');
const { asyncHandler, sendSuccess } = require('../../../utils/helpers');

class PediatriaController {
  getStatus = asyncHandler(async (req, res) => {
    const status = await pediatriaService.getStatus();
    return sendSuccess(res, status, 'Información del módulo Centro Médico Pediátrico');
  });

  getPacientes = asyncHandler(async (req, res) => {
    const pacientes = await pediatriaService.getAllPacientes();
    return sendSuccess(res, pacientes, 'Lista de pacientes pediátricos obtenida');
  });

  createPaciente = asyncHandler(async (req, res) => {
    const nuevoPaciente = await pediatriaService.createPaciente(req.body);
    return sendSuccess(res, nuevoPaciente, 'Paciente pediátrico registrado con éxito', 201);
  });

  getTutores = asyncHandler(async (req, res) => {
    const tutores = await pediatriaService.getAllTutores();
    return sendSuccess(res, tutores, 'Lista de tutores obtenida');
  });

  createTutor = asyncHandler(async (req, res) => {
    const nuevoTutor = await pediatriaService.createTutor(req.body);
    return sendSuccess(res, nuevoTutor, 'Tutor registrado con éxito', 201);
  });

  createControl = asyncHandler(async (req, res) => {
    const nuevoControl = await pediatriaService.createControlCrecimiento(req.body);
    return sendSuccess(res, nuevoControl, 'Control de crecimiento registrado con éxito', 201);
  });
}

module.exports = new PediatriaController();
