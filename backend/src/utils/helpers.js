class AppError extends Error {
  constructor(message, statusCode = 500, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;
    this.details = details;

    Error.captureStackTrace(this, this.constructor);
  }
}

const asyncHandler = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};

const sendSuccess = (res, data = null, message = 'Operación exitosa', statusCode = 200) => {
  return res.status(statusCode).json({
    status: 'success',
    message,
    data,
    timestamp: new Date().toISOString(),
  });
};

const sendError = (res, message = 'Error interno del servidor', statusCode = 500, details = null) => {
  return res.status(statusCode).json({
    status: `${statusCode}`.startsWith('4') ? 'fail' : 'error',
    message,
    ...(details ? { details } : {}),
    timestamp: new Date().toISOString(),
  });
};

module.exports = {
  AppError,
  asyncHandler,
  sendSuccess,
  sendError,
};
