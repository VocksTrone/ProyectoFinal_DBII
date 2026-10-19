const hospitalService = require('../services/hospital.service');
const { asyncHandler, sendSuccess } = require('../../../utils/helpers');

class HospitalController {
  getStatus = asyncHandler(async (req, res) => {
    const status = await hospitalService.getStatus();
    return sendSuccess(res, status, 'Información del módulo Hospital General');
  });

  getPacientes = asyncHandler(async (req, res) => {
    const pacientes = await hospitalService.getAllPacientes();
    return sendSuccess(res, pacientes, 'Lista de pacientes obtenida');
  });

  createPaciente = asyncHandler(async (req, res) => {
    const nuevoPaciente = await hospitalService.createPaciente(req.body);
    return sendSuccess(res, nuevoPaciente, 'Paciente registrado con éxito', 201);
  });

  getConsultas = asyncHandler(async (req, res) => {
    const consultas = await hospitalService.getAllConsultas();
    return sendSuccess(res, consultas, 'Lista de consultas obtenida');
  });

  createConsulta = asyncHandler(async (req, res) => {
    const nuevaConsulta = await hospitalService.createConsulta(req.body);
    return sendSuccess(res, nuevaConsulta, 'Consulta creada con éxito', 201);
  });
}

module.exports = new HospitalController();
