const { Router } = require('express');
const pediatriaController = require('../controllers/pediatria.controller');

const router = Router();

router.get('/', pediatriaController.getStatus);

router.get('/pacientes', pediatriaController.getPacientes);

router.post('/pacientes', pediatriaController.createPaciente);

router.get('/tutores', pediatriaController.getTutores);

router.post('/tutores', pediatriaController.createTutor);

router.post('/controles', pediatriaController.createControl);

module.exports = router;
