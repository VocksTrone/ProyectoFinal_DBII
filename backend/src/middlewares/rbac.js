const { AppError } = require('../utils/helpers');

const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Usuario no autenticado', 401));
    }

    const userRoles = [req.user.rol || 'invitado'];

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
