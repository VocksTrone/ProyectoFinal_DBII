const { Router } = require('express');
const c = require('../controllers/pediatria.controller');
const { authenticate } = require('../../../middlewares/auth');
const { authorizeRoles } = require('../../../middlewares/rbac');
const { soloInstitucion } = require('../../../middlewares/adaptador');

const router = Router();

// Estado del módulo
router.get('/', c.getStatus);

// De aquí en adelante: token y usuario de pediatría
router.use(authenticate, soloInstitucion('pediatria'));

const medico = authorizeRoles('medico');

// Encargados
router.get('/tutores', c.listarTutores);
router.post('/tutores', c.crearTutor);
router.get('/tutores/:id', c.obtenerTutor);

// Vacunas del esquema
router.get('/vacunas', c.listarVacunas);

// Controles de crecimiento
router.get('/pacientes/:id/controles', c.obtenerControles);
router.post('/pacientes/:id/controles', medico, c.registrarControl);

// Vacunas del paciente
router.get('/pacientes/:id/vacunas', c.obtenerEsquema);
router.post('/pacientes/:id/vacunas', medico, c.registrarVacuna);

// Rutas anteriores, se dejan por compatibilidad
router.get('/pacientes', c.getPacientes);
router.post('/pacientes', c.createPaciente);
router.post('/controles', medico, c.createControl);

module.exports = router;
