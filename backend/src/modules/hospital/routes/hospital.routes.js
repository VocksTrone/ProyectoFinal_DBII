const { Router } = require('express');
const hospitalController = require('../controllers/hospital.controller');

const router = Router();

// Rutas de información y estado
router.get('/', hospitalController.getStatus);

// Pacientes
router.get('/pacientes', hospitalController.getPacientes);
router.post('/pacientes', hospitalController.createPaciente);

// Consultas
router.get('/consultas', hospitalController.getConsultas);
router.post('/consultas', hospitalController.createConsulta);

module.exports = router;
