const { obtenerAdaptador } = require('../adaptadores');
const { AppError } = require('../utils/helpers');

// Pone en req.adaptador el motor de la institución del usuario
const usarAdaptador = (req, res, next) => {
  const adaptador = obtenerAdaptador(req.user.institucion);

  if (!adaptador) {
    return next(new AppError(`La institución "${req.user.institucion}" aún no está disponible`, 503));
  }

  req.adaptador = adaptador;
  next();
};

module.exports = { usarAdaptador };
