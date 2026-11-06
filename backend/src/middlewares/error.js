const config = require('../config/env');
const { AppError } = require('../utils/helpers');

const notFoundHandler = (req, res, next) => {
  next(new AppError(`Ruta no encontrada: ${req.method} ${req.originalUrl}`, 404));
};

const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Error interno del servidor';
  let details = err.details || null;

  // Código de error del motor (pg, mysql2 o mongo)
  const codigoMotor = err.parent?.code || err.original?.code || err.code;

  if (err.name === 'SequelizeUniqueConstraintError' || codigoMotor === '23505' || codigoMotor === 11000) {
    statusCode = 409;
    message = 'Ya existe un registro con esos datos';
    details = err.errors ? err.errors.map((e) => ({ field: e.path, message: e.message })) : null;
  } else if (['23502', '23503', '23514', '22P02', '22007', '22008', '22001'].includes(codigoMotor)) {
    // not null, llave foránea, check, formato, fecha inválida o texto muy largo en PostgreSQL
    statusCode = 400;
    message = 'Datos rechazados por la base de datos';
    details = [{ message: err.parent?.detail || err.original?.detail || err.message }];
  } else if (err.name === 'SequelizeValidationError') {
    statusCode = 400;
    message = 'Error de validación en la base de datos relacional';
    details = err.errors.map((e) => ({ field: e.path, message: e.message }));
  } else if (err.name === 'SequelizeConnectionError') {
    statusCode = 503;
    message = 'Error de conexión con la base de datos relacional';
  }

  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Error de validación en MongoDB';
    details = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }));
  } else if (err.name === 'CastError') {
    statusCode = 400;
    message = `Formato de ID inválido: ${err.value}`;
  }

  const response = {
    status: `${statusCode}`.startsWith('4') ? 'fail' : 'error',
    message,
    ...(details ? { details } : {}),
    timestamp: new Date().toISOString(),
    ...(config.env === 'development' ? { stack: err.stack } : {}),
  };

  // Solo errores inesperados
  if (statusCode >= 500 && !err.isOperational) {
    console.error('[Server Error]:', err);
  }

  res.status(statusCode).json(response);
};

module.exports = {
  notFoundHandler,
  errorHandler,
};
