const { Router } = require('express');
const c = require('../controllers/hospital.controller');
const { authenticate } = require('../../../middlewares/auth');
const { authorizeRoles } = require('../../../middlewares/rbac');
const { soloInstitucion } = require('../../../middlewares/adaptador');

const router = Router();
router.use(authenticate, soloInstitucion('hospital'));

const medico = authorizeRoles('medico');

// Citas
router.get('/citas', c.listarCitas);
router.post('/citas', c.agendarCita);
router.patch('/citas/:id', c.reprogramarCita);
router.patch('/citas/:id/cancelar', c.cancelarCita);

// Antecedentes
router.post('/pacientes/:id/antecedentes', medico, c.agregarAntecedente);

// Internamientos
router.get('/internamientos', c.listarInternamientos);
router.get('/internamientos/:id', c.obtenerInternamiento);
router.post('/internamientos', medico, c.internar);
router.post('/internamientos/:id/medicamentos', medico, c.agregarMedicamento);
router.post('/internamientos/:id/dietas', medico, c.agregarDieta);
router.patch('/internamientos/:id/alta', medico, c.darAlta);

module.exports = router;
