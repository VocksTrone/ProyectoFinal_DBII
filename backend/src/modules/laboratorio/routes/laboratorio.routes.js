const { Router } = require('express');
const laboratorioController = require('../controllers/laboratorio.controller');

const router = Router();

// Estado e info
router.get('/', laboratorioController.getStatus);

// Pacientes
router.get('/pacientes', laboratorioController.getPacientes);
router.post('/pacientes', laboratorioController.createPaciente);

// Órdenes de examen
router.get('/ordenes', laboratorioController.getOrdenes);
router.post('/ordenes', laboratorioController.createOrden);
router.post('/ordenes/:ordenId/resultados', laboratorioController.addResultados);

module.exports = router;
