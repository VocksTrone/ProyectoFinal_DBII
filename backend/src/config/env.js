const dotenv = require('dotenv');
const path = require('path');

// Cargar variables desde .env
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 4000,

  // Seguridad & JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'secret_key_default_db2',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  },

  // 1. Hospital General (PostgreSQL)
  postgres: {
    host: process.env.PG_HOST || 'localhost',
    port: parseInt(process.env.PG_PORT, 10) || 5432,
    database: process.env.PG_DATABASE || 'hospital_general_db',
    username: process.env.PG_USER || 'postgres',
    password: process.env.PG_PASSWORD || 'postgres',
    logging: process.env.PG_LOGGING === 'true',
  },

  // 2. Centro Pediátrico (MySQL)
  mysql: {
    host: process.env.MYSQL_HOST || 'localhost',
    port: parseInt(process.env.MYSQL_PORT, 10) || 3306,
    database: process.env.MYSQL_DATABASE || 'centro_pediatrico_db',
    username: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || 'root',
    logging: process.env.MYSQL_LOGGING === 'true',
  },

  // 3. Clínica Odontológica (Firebase Firestore)
  firebase: {
    serviceAccountPath: process.env.FIREBASE_SERVICE_ACCOUNT_PATH || '',
    projectId: process.env.FIREBASE_PROJECT_ID || '',
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL || '',
    privateKey: process.env.FIREBASE_PRIVATE_KEY
      ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
      : '',
  },

  // 4. Laboratorio Clínico (MongoDB)
  mongodb: {
    uri: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/laboratorio_clinico_db',
  },
};

module.exports = config;
