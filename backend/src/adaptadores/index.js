const fs = require('fs');
const path = require('path');

// Institución -> carpeta del adaptador de su motor
const carpetas = {
  hospital: 'postgres',
  laboratorio: 'mongodb',
  pediatria: 'mysql',
  odontologia: 'firebase',
};

const instituciones = Object.keys(carpetas);

// null si esa institución todavía no tiene adaptador
const obtenerAdaptador = (institucion) => {
  const carpeta = carpetas[institucion];
  if (!carpeta) return null;

  const ruta = path.join(__dirname, carpeta);
  if (!fs.existsSync(path.join(ruta, 'index.js'))) return null;

  return require(ruta);
};

module.exports = {
  instituciones,
  obtenerAdaptador,
};
