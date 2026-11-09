const { Router } = require('express');
const odontologiaController = require('../controllers/odontologia.controller');
const { authenticate } = require('../../../middlewares/auth');
const { authorizeRoles } = require('../../../middlewares/rbac');
const { soloInstitucion } = require('../../../middlewares/adaptador');

const router = Router();

// Estado del módulo (público)
router.get('/', odontologiaController.getStatus);

// De aquí en adelante: token y usuario de odontología
router.use(authenticate, soloInstitucion('odontologia'));

const medico = authorizeRoles('medico');

// Pacientes
router.get('/pacientes', odontologiaController.getPacientes);
router.post('/pacientes', odontologiaController.createPaciente);
router.get('/pacientes/:id', odontologiaController.getPacienteById);
router.put('/pacientes/:id', odontologiaController.updatePaciente);
router.post('/pacientes/:id/historial', medico, odontologiaController.addHistorialPaciente);

// Odontólogos
router.get('/odontologos', odontologiaController.getOdontologos);
router.post('/odontologos', odontologiaController.createOdontologo);
router.get('/odontologos/:id', odontologiaController.getOdontologoById);
router.put('/odontologos/:id', odontologiaController.updateOdontologo);

// Citas
router.get('/citas', odontologiaController.getCitas);
router.post('/citas', odontologiaController.createCita);
router.get('/citas/:id', odontologiaController.getCitaById);
router.put('/citas/:id', odontologiaController.updateCita);
router.patch('/citas/:id/estado', odontologiaController.updateEstadoCita);

// Pagos
router.get('/pagos', odontologiaController.getPagos);
router.post('/pagos', odontologiaController.createPago);
router.get('/pagos/:id', odontologiaController.getPagoById);
router.put('/pagos/:id', odontologiaController.updatePago);
router.get('/pagos/cita/:citaId', odontologiaController.getPagosByCita);

module.exports = router;
