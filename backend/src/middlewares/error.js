const config = require('../config/env');
const { AppError } = require('../utils/helpers');

/**
 * Middleware para rutas no encontradas (404)
 */
const notFoundHandler = (req, res, next) => {
  next(new AppError(`Ruta no encontrada: ${req.method} ${req.originalUrl}`, 404));
};

/**
 * Middleware global de manejo de errores
 */
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Error interno del servidor';
  let details = err.details || null;

  // Manejo de errores específicos de Sequelize (PostgreSQL / MySQL)
  if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
    statusCode = 400;
    message = 'Error de validación en la base de datos relacional';
    details = err.errors.map((e) => ({ field: e.path, message: e.message }));
  } else if (err.name === 'SequelizeConnectionError') {
    statusCode = 503;
    message = 'Error de conexión con la base de datos relacional';
  }

  // Manejo de errores específicos de Mongoose (MongoDB)
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Error de validación en MongoDB';
    details = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }));
  } else if (err.name === 'CastError') {
    statusCode = 400;
    message = `Formato de ID inválido: ${err.value}`;
  }

  // Formato de respuesta JSON estandarizado
  const response = {
    status: `${statusCode}`.startsWith('4') ? 'fail' : 'error',
    message,
    ...(details ? { details } : {}),
    timestamp: new Date().toISOString(),
    ...(config.env === 'development' ? { stack: err.stack } : {}),
  };

  if (statusCode >= 500) {
    console.error('💥 [Server Error]:', err);
  }

  res.status(statusCode).json(response);
};

module.exports = {
  notFoundHandler,
  errorHandler,
};
