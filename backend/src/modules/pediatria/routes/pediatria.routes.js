const { Router } = require('express');
const pediatriaController = require('../controllers/pediatria.controller');

const router = Router();

// Estado e info
router.get('/', pediatriaController.getStatus);

// Pacientes pediátricos
router.get('/pacientes', pediatriaController.getPacientes);
router.post('/pacientes', pediatriaController.createPaciente);

// Tutores
router.get('/tutores', pediatriaController.getTutores);
router.post('/tutores', pediatriaController.createTutor);

// Controles de Crecimiento
router.post('/controles', pediatriaController.createControl);

module.exports = router;
