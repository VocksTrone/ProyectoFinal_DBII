const jwt = require('jsonwebtoken');
const config = require('../config/env');
const { AppError } = require('../utils/helpers');

/**
 * Middleware para autenticar solicitudes mediante JSON Web Token (JWT)
 */
const authenticate = (req, res, next) => {
  try {
    let token = null;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      throw new AppError('No se proporcionó token de autenticación', 401);
    }

    const decoded = jwt.verify(token, config.jwt.secret);
    req.user = decoded; // { id, username, email, role, institucion, ... }
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return next(new AppError('Token de autenticación inválido', 401));
    }
    if (error.name === 'TokenExpiredError') {
      return next(new AppError('El token de autenticación ha expirado', 401));
    }
    next(error);
  }
};

/**
 * Generar token JWT para pruebas o login
 */
const generateToken = (payload) => {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  });
};

module.exports = {
  authenticate,
  generateToken,
};
