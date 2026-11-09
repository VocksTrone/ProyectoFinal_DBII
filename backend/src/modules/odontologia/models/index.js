const { PacienteModel, validatePaciente, validateHistorialEntry } = require('./paciente.model');
const { OdontologoModel, validateOdontologo } = require('./odontologo.model');
const { CitaModel, validateCita, ESTADOS_VALIDOS: ESTADOS_CITA } = require('./cita.model');
const {
  PagoModel,
  validatePago,
  validateDesgloseItem,
  validateHonorariosMedicos,
  ESTADOS_PAGO,
  METODOS_PAGO,
} = require('./pago.model');

module.exports = {
  PacienteModel,
  OdontologoModel,
  CitaModel,
  PagoModel,
  validatePaciente,
  validateHistorialEntry,
  validateOdontologo,
  validateCita,
  validatePago,
  validateDesgloseItem,
  validateHonorariosMedicos,
  ESTADOS_CITA,
  ESTADOS_PAGO,
  METODOS_PAGO,
};
