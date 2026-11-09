const fs = require('fs');
const path = require('path');
const dns = require('dns');
const mongoose = require('mongoose');
const config = require('./env');

const resolveMongoUri = () => {
  const rawUri = (config.mongodb.uri || '').trim();

  if (rawUri.startsWith('mongodb://') || rawUri.startsWith('mongodb+srv://')) {
    return rawUri;
  }

  const candidatePaths = [
    rawUri ? path.resolve(process.cwd(), rawUri) : null,
    rawUri ? path.resolve(__dirname, '../../', rawUri) : null,
    config.mongodb.credentialsPath ? path.resolve(process.cwd(), config.mongodb.credentialsPath) : null,
    config.mongodb.credentialsPath ? path.resolve(__dirname, '../../', config.mongodb.credentialsPath) : null,
    path.resolve(__dirname, '../../../credentials/laboratorio_clinico_mongodb.json'),
    path.resolve(process.cwd(), 'credentials/laboratorio_clinico_mongodb.json'),
    path.resolve(__dirname, 'laboratorio_clinico_mongodb.json'),
  ].filter(Boolean);

  for (const candidate of candidatePaths) {
    if (fs.existsSync(candidate) && candidate.endsWith('.json')) {
      try {
        const creds = JSON.parse(fs.readFileSync(candidate, 'utf-8'));
        if (creds.username && creds.password && creds.cluster) {
          const user = encodeURIComponent(creds.username);
          const pass = encodeURIComponent(creds.password);
          const db = creds.database || 'laboratorio_clinico_db';
          const app = creds.appName ? `&appName=${encodeURIComponent(creds.appName)}` : '';
          console.log(`[Laboratorio Clínico] Credenciales cargadas desde ${path.basename(candidate)}`);
          return `mongodb+srv://${user}:${pass}@${creds.cluster}/${db}?retryWrites=true&w=majority${app}`;
        }
      } catch (err) {
        console.warn(`[Laboratorio Clínico] Error leyendo credenciales JSON (${candidate}):`, err.message);
      }
    }
  }

  return rawUri || 'mongodb://127.0.0.1:27017/laboratorio_clinico_db';
};

const connectMongoDB = async () => {
  const uri = resolveMongoUri();

  // Algunas redes (y Windows) fallan con DNS SRV; se usan DNS públicos
  if (uri.startsWith('mongodb+srv://')) {
    try {
      dns.setServers(['8.8.8.8', '1.1.1.1']);
    } catch (_) {}
  }

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`[Laboratorio Clínico] Conectado exitosamente a MongoDB: ${conn.connection.host}/${conn.connection.name}`);
    return true;
  } catch (error) {
    console.error('[Laboratorio Clínico] Error conectando a MongoDB:', error.message);
    return false;
  }
};

mongoose.connection.on('disconnected', () => {
  console.warn('[Laboratorio Clínico] Conexión a MongoDB perdida');
});

mongoose.connection.on('error', (err) => {
  console.error('[Laboratorio Clínico] Error en conexión Mongoose:', err.message);
});

module.exports = {
  mongoose,
  connectMongoDB,
  resolveMongoUri,
};
