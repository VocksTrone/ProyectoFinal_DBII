const odontologiaService = require('../services/odontologia.service');
const { asyncHandler, sendSuccess } = require('../../../utils/helpers');

class OdontologiaController {
  getStatus = asyncHandler(async (req, res) => {
    const status = await odontologiaService.getStatus();
    return sendSuccess(res, status, 'Información del módulo Clínica Odontológica (Firestore)');
  });

  getPacientes = asyncHandler(async (req, res) => {
    const limit = req.query.limit || 100;
    const pacientes = await odontologiaService.getAllPacientes(limit);
    return sendSuccess(res, pacientes, 'Lista de pacientes odontológicos obtenida');
  });

  getPacienteById = asyncHandler(async (req, res) => {
    const paciente = await odontologiaService.getPacienteById(req.params.id);
    return sendSuccess(res, paciente, 'Paciente odontológico obtenido con éxito');
  });

  createPaciente = asyncHandler(async (req, res) => {
    const nuevoPaciente = await odontologiaService.createPaciente(req.body);
    return sendSuccess(res, nuevoPaciente, 'Paciente odontológico registrado con éxito', 201);
  });

  updatePaciente = asyncHandler(async (req, res) => {
    const paciente = await odontologiaService.updatePaciente(req.params.id, req.body);
    return sendSuccess(res, paciente, 'Paciente odontológico actualizado con éxito');
  });

  addHistorialPaciente = asyncHandler(async (req, res) => {
    const paciente = await odontologiaService.addHistorialPaciente(req.params.id, req.body);
    return sendSuccess(res, paciente, 'Entrada de historial odontológico agregada con éxito', 201);
  });

  getOdontologos = asyncHandler(async (req, res) => {
    const limit = req.query.limit || 100;
    const odontologos = await odontologiaService.getAllOdontologos(limit);
    return sendSuccess(res, odontologos, 'Lista de odontólogos obtenida');
  });

  getOdontologoById = asyncHandler(async (req, res) => {
    const odontologo = await odontologiaService.getOdontologoById(req.params.id);
    return sendSuccess(res, odontologo, 'Odontólogo obtenido con éxito');
  });

  createOdontologo = asyncHandler(async (req, res) => {
    const nuevoOdontologo = await odontologiaService.createOdontologo(req.body);
    return sendSuccess(res, nuevoOdontologo, 'Odontólogo registrado con éxito', 201);
  });

  updateOdontologo = asyncHandler(async (req, res) => {
    const odontologo = await odontologiaService.updateOdontologo(req.params.id, req.body);
    return sendSuccess(res, odontologo, 'Odontólogo actualizado con éxito');
  });

  getCitas = asyncHandler(async (req, res) => {
    const { paciente_id, odontologo_id, estado, limit } = req.query;
    const citas = await odontologiaService.getAllCitas({ paciente_id, odontologo_id, estado, limit });
    return sendSuccess(res, citas, 'Lista de citas odontológicas obtenida');
  });

  getCitaById = asyncHandler(async (req, res) => {
    const cita = await odontologiaService.getCitaById(req.params.id);
    return sendSuccess(res, cita, 'Cita odontológica obtenida con éxito');
  });

  createCita = asyncHandler(async (req, res) => {
    const nuevaCita = await odontologiaService.createCita(req.body);
    return sendSuccess(res, nuevaCita, 'Cita odontológica agendada con éxito', 201);
  });

  updateCita = asyncHandler(async (req, res) => {
    const cita = await odontologiaService.updateCita(req.params.id, req.body);
    return sendSuccess(res, cita, 'Cita odontológica actualizada con éxito');
  });

  updateEstadoCita = asyncHandler(async (req, res) => {
    const { estado } = req.body;
    const cita = await odontologiaService.updateEstadoCita(req.params.id, estado);
    return sendSuccess(res, cita, `Estado de la cita actualizado a "${estado}"`);
  });

  getPagos = asyncHandler(async (req, res) => {
    const { paciente_id, cita_id, estado_pago, limit } = req.query;
    const pagos = await odontologiaService.getAllPagos({ paciente_id, cita_id, estado_pago, limit });
    return sendSuccess(res, pagos, 'Lista de pagos odontológicos obtenida');
  });

  getPagoById = asyncHandler(async (req, res) => {
    const pago = await odontologiaService.getPagoById(req.params.id);
    return sendSuccess(res, pago, 'Pago odontológico obtenido con éxito');
  });

  getPagosByCita = asyncHandler(async (req, res) => {
    const pagos = await odontologiaService.getPagosByCita(req.params.citaId);
    return sendSuccess(res, pagos, 'Pagos de la cita obtenidos con éxito');
  });

  createPago = asyncHandler(async (req, res) => {
    const nuevoPago = await odontologiaService.createPago(req.body);
    return sendSuccess(res, nuevoPago, 'Pago odontológico procesado con éxito', 201);
  });

  updatePago = asyncHandler(async (req, res) => {
    const pago = await odontologiaService.updatePago(req.params.id, req.body);
    return sendSuccess(res, pago, 'Pago odontológico actualizado con éxito');
  });
}

module.exports = new OdontologiaController();
