const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const config = require('./config/env');
const { notFoundHandler, errorHandler } = require('./middlewares/error');
const { sendSuccess } = require('./utils/helpers');

const { authRoutes, pacientesRoutes, catalogosRoutes } = require('./api/comun.routes');

const hospitalRoutes = require('./modules/hospital/routes/hospital.routes');
const pediatriaRoutes = require('./modules/pediatria/routes/pediatria.routes');
const odontologiaRoutes = require('./modules/odontologia/routes/odontologia.routes');

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (config.env === 'development') {
  app.use(morgan('dev'));
}

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

// Rutas comunes (el motor depende de la institución del usuario)
app.use('/api/auth', authRoutes);
app.use('/api/pacientes', pacientesRoutes);
app.use('/api/catalogos', catalogosRoutes);

// Rutas propias de cada institución
app.use('/api/hospital', hospitalRoutes);
app.use('/api/pediatria', pediatriaRoutes);
app.use('/api/odontologia', odontologiaRoutes);

app.use(notFoundHandler);

app.use(errorHandler);

module.exports = app;
