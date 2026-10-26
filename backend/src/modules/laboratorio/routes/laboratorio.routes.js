const { Router } = require('express');
const laboratorioController = require('../controllers/laboratorio.controller');

const router = Router();

router.get('/', laboratorioController.getStatus);

router.get('/pacientes', laboratorioController.getPacientes);
router.post('/pacientes', laboratorioController.createPaciente);

router.get('/ordenes', laboratorioController.getOrdenes);
router.post('/ordenes', laboratorioController.createOrden);
router.post('/ordenes/:ordenId/resultados', laboratorioController.addResultados);

module.exports = router;
