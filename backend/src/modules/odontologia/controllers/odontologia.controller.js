const odontologiaService = require('../services/odontologia.service');
const { asyncHandler, sendSuccess } = require('../../../utils/helpers');

class OdontologiaController {
  getStatus = asyncHandler(async (req, res) => {
    const status = await odontologiaService.getStatus();
    return sendSuccess(res, status, 'Información del módulo Clínica Odontológica');
  });

  getPacientes = asyncHandler(async (req, res) => {
    const pacientes = await odontologiaService.getAllPacientes();
    return sendSuccess(res, pacientes, 'Lista de pacientes odontológicos obtenida');
  });

  createPaciente = asyncHandler(async (req, res) => {
    const nuevoPaciente = await odontologiaService.createPaciente(req.body);
    return sendSuccess(res, nuevoPaciente, 'Paciente odontológico registrado con éxito', 201);
  });

  getCitas = asyncHandler(async (req, res) => {
    const citas = await odontologiaService.getAllCitas();
    return sendSuccess(res, citas, 'Lista de citas odontológicas obtenida');
  });

  createCita = asyncHandler(async (req, res) => {
    const nuevaCita = await odontologiaService.createCita(req.body);
    return sendSuccess(res, nuevaCita, 'Cita odontológica agendada con éxito', 201);
  });
}

module.exports = new OdontologiaController();
