const { Router } = require('express');
const odontologiaController = require('../controllers/odontologia.controller');

const router = Router();

// Estado e información del módulo
router.get('/', odontologiaController.getStatus);

// 1. Pacientes
router.get('/pacientes', odontologiaController.getPacientes);
router.post('/pacientes', odontologiaController.createPaciente);
router.get('/pacientes/:id', odontologiaController.getPacienteById);
router.put('/pacientes/:id', odontologiaController.updatePaciente);
router.post('/pacientes/:id/historial', odontologiaController.addHistorialPaciente);

// 2. Odontólogos
router.get('/odontologos', odontologiaController.getOdontologos);
router.post('/odontologos', odontologiaController.createOdontologo);
router.get('/odontologos/:id', odontologiaController.getOdontologoById);
router.put('/odontologos/:id', odontologiaController.updateOdontologo);

// 3. Citas
router.get('/citas', odontologiaController.getCitas);
router.post('/citas', odontologiaController.createCita);
router.get('/citas/:id', odontologiaController.getCitaById);
router.put('/citas/:id', odontologiaController.updateCita);
router.patch('/citas/:id/estado', odontologiaController.updateEstadoCita);

// 4. Pagos (Mixtos y Honorarios)
router.get('/pagos', odontologiaController.getPagos);
router.post('/pagos', odontologiaController.createPago);
router.get('/pagos/:id', odontologiaController.getPagoById);
router.put('/pagos/:id', odontologiaController.updatePago);
router.get('/pagos/cita/:citaId', odontologiaController.getPagosByCita);

module.exports = router;
