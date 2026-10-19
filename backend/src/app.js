const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const config = require('./config/env');
const { notFoundHandler, errorHandler } = require('./middlewares/error');
const { sendSuccess } = require('./utils/helpers');

// Importación de rutas modulares por institución
const hospitalRoutes = require('./modules/hospital/routes/hospital.routes');
const pediatriaRoutes = require('./modules/pediatria/routes/pediatria.routes');
const odontologiaRoutes = require('./modules/odontologia/routes/odontologia.routes');
const laboratorioRoutes = require('./modules/laboratorio/routes/laboratorio.routes');

const app = express();

// Middlewares globales de seguridad y utilidades
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (config.env === 'development') {
  app.use(morgan('dev'));
}

// Ruta raíz y comprobación de estado de salud (Health Check)
app.get('/api/health', (req, res) => {
  return sendSuccess(res, {
    project: 'Red de Instituciones Médicas - Bases de Datos II',
    status: 'online',
    timestamp: new Date().toISOString(),
    instituciones: {
      hospital_general: {
        engine: 'PostgreSQL',
        prefix: '/api/hospital',
        model: 'Relacional 3FN',
      },
      centro_pediatrico: {
        engine: 'MySQL',
        prefix: '/api/pediatria',
        model: 'Relacional',
      },
      clinica_odontologica: {
        engine: 'Firebase Firestore',
        prefix: '/api/odontologia',
        model: 'NoSQL Documental',
      },
      laboratorio_clinico: {
        engine: 'MongoDB',
        prefix: '/api/laboratorio',
        model: 'NoSQL Documental',
      },
    },
  }, 'Servidor de Red Médica en funcionamiento');
});

// Montaje de rutas de módulos por institución
app.use('/api/hospital', hospitalRoutes);
app.use('/api/pediatria', pediatriaRoutes);
app.use('/api/odontologia', odontologiaRoutes);
app.use('/api/laboratorio', laboratorioRoutes);

// Manejo de rutas inexistentes (404)
app.use(notFoundHandler);

// Manejador centralizado de errores
app.use(errorHandler);

module.exports = app;
