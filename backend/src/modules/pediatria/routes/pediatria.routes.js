const { Router } = require('express');
const c = require('../controllers/pediatria.controller');
const { authenticate } = require('../../../middlewares/auth');
const { authorizeRoles } = require('../../../middlewares/rbac');
const { soloInstitucion } = require('../../../middlewares/adaptador');

const router = Router();

// Estado del módulo (informativo, abierto o con token)
router.get('/', c.getStatus);

// Todas las operaciones de datos requieren token y pertenecer a 'pediatria'
router.use(authenticate, soloInstitucion('pediatria'));

const medico = authorizeRoles('medico');

// Tutores / Encargados
router.get('/tutores', c.listarTutores);
router.post('/tutores', c.crearTutor);
router.get('/tutores/:id', c.obtenerTutor);

// Vacunas del esquema
router.get('/vacunas', c.listarVacunas);

// Controles antropométricos de crecimiento y desarrollo
router.get('/pacientes/:id/controles', c.obtenerControles);
router.post('/pacientes/:id/controles', medico, c.registrarControl);

// Carné y esquema de vacunación del paciente
router.get('/pacientes/:id/vacunas', c.obtenerEsquema);
router.post('/pacientes/:id/vacunas', medico, c.registrarVacuna);

// Compatibilidad con rutas directas del módulo
router.get('/pacientes', c.getPacientes);
router.post('/pacientes', c.createPaciente);
router.post('/controles', medico, c.createControl);

module.exports = router;
