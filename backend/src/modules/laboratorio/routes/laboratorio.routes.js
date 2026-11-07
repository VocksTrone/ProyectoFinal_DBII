const { Router } = require('express');
const c = require('../controllers/laboratorio.controller');
const { authenticate } = require('../../../middlewares/auth');
const { authorizeRoles } = require('../../../middlewares/rbac');
const { soloInstitucion } = require('../../../middlewares/adaptador');

const router = Router();
router.use(authenticate, soloInstitucion('laboratorio'));

const medico = authorizeRoles('medico');

router.get('/ordenes', c.listarOrdenes);
router.post('/ordenes', c.crearOrden);
router.get('/ordenes/:id', medico, c.obtenerOrden);
router.post('/ordenes/:id/examenes', c.agregarExamenes);
router.put('/ordenes/:id/examenes/:idExamen/resultado', medico, c.registrarResultado);

module.exports = router;
