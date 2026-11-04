const bcrypt = require('bcryptjs');
const { AppError } = require('../utils/helpers');

// "rdiaz@hospital" -> { usuario: "rdiaz", institucion: "hospital" }
const separarUsuario = (valor) => {
  const texto = typeof valor === 'string' ? valor.trim().toLowerCase() : '';
  const i = texto.lastIndexOf('@');
  if (i <= 0 || i === texto.length - 1) {
    throw new AppError('El usuario debe tener el formato usuario@institucion', 400);
  }
  return { usuario: texto.slice(0, i), institucion: texto.slice(i + 1) };
};

const login = async (adaptador, { usuario, institucion, password }) => {
  const registro = await adaptador.buscarUsuario(usuario);

  // Mismo mensaje si no existe o si la contraseña falla
  const valido = registro && (await bcrypt.compare(String(password || ''), registro.password_hash));
  if (!valido) throw new AppError('Usuario o contraseña incorrectos', 401);

  return {
    id: String(registro.id),
    nombre: registro.nombre,
    rol: registro.rol,
    institucion,
  };
};

module.exports = {
  separarUsuario,
  login,
};
