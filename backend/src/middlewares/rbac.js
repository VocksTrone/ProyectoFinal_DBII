const { AppError } = require('../utils/helpers');

/**
 * Middleware de Control de Acceso Basado en Roles (RBAC)
 * @param  {...string} allowedRoles - Lista de roles permitidos para acceder a la ruta
 */
const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Usuario no autenticado', 401));
    }

    const userRoles = Array.isArray(req.user.roles)
      ? req.user.roles
      : [req.user.role || 'guest'];

    const hasPermission = userRoles.some(
      (role) => allowedRoles.includes(role) || role === 'admin'
    );

    if (!hasPermission) {
      return next(
        new AppError(
          `Acceso denegado: se requiere uno de los roles [${allowedRoles.join(', ')}]`,
          403
        )
      );
    }

    next();
  };
};

module.exports = {
  authorizeRoles,
};
