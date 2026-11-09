const { obtenerAdaptador } = require('../adaptadores');
const { AppError } = require('../utils/helpers');

const usarAdaptador = (req, res, next) => {
  const adaptador = obtenerAdaptador(req.user.institucion);

  if (!adaptador) {
    return next(new AppError(`La institución "${req.user.institucion}" aún no está disponible`, 503));
  }

  req.adaptador = adaptador;
  next();
};

// Rutas propias: solo usuarios de esa institución
const soloInstitucion = (institucion) => (req, res, next) =>
  req.user.institucion === institucion
    ? next()
    : next(new AppError('Estas rutas pertenecen a otra institución', 403));

module.exports = { usarAdaptador, soloInstitucion };
