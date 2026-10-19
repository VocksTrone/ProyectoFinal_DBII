const { Router } = require('express');
const odontologiaController = require('../controllers/odontologia.controller');

const router = Router();

// Estado e info
router.get('/', odontologiaController.getStatus);

// Pacientes odontológicos (con historial embebido)
router.get('/pacientes', odontologiaController.getPacientes);
router.post('/pacientes', odontologiaController.createPaciente);

// Citas odontológicas
router.get('/citas', odontologiaController.getCitas);
router.post('/citas', odontologiaController.createCita);

module.exports = router;
