const { Router } = require('express');
const odontologiaController = require('../controllers/odontologia.controller');

const router = Router();
router.get('/', odontologiaController.getStatus);

router.get('/pacientes', odontologiaController.getPacientes);
router.post('/pacientes', odontologiaController.createPaciente);

router.get('/citas', odontologiaController.getCitas);
router.post('/citas', odontologiaController.createCita);

module.exports = router;
