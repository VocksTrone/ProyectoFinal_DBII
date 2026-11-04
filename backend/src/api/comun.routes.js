const { Router } = require('express');
const c = require('./comun.controller');
const { authenticate } = require('../middlewares/auth');
const { authorizeRoles } = require('../middlewares/rbac');
const { usarAdaptador } = require('../middlewares/adaptador');

// Login (sin token)
const authRoutes = Router();
authRoutes.post('/login', c.login);

// Pacientes: requiere token y usa el motor de la institución del usuario
const pacientesRoutes = Router();
pacientesRoutes.use(authenticate, usarAdaptador);
pacientesRoutes.get('/', c.buscarPacientes);
pacientesRoutes.post('/', c.crearPaciente);
pacientesRoutes.get('/:id', c.obtenerPaciente);
pacientesRoutes.get('/:id/historial', authorizeRoles('medico'), c.obtenerHistorial);
pacientesRoutes.patch('/:id/archivar', c.archivarPaciente);
pacientesRoutes.post('/:id/atenciones', authorizeRoles('medico'), c.registrarAtencion);

// Catálogos
const catalogosRoutes = Router();
catalogosRoutes.use(authenticate, usarAdaptador);
catalogosRoutes.get('/:tipo', c.obtenerCatalogo);

module.exports = {
  authRoutes,
  pacientesRoutes,
  catalogosRoutes,
};
