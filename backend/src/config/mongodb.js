const mongoose = require('mongoose');
const config = require('./env');

/**
 * Conectar y verificar conexión a MongoDB (Laboratorio Clínico)
 */
const connectMongoDB = async () => {
  try {
    const conn = await mongoose.connect(config.mongodb.uri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`✅ [Laboratorio Clínico] Conectado exitosamente a MongoDB: ${conn.connection.host}/${conn.connection.name}`);
    return true;
  } catch (error) {
    console.error('❌ [Laboratorio Clínico] Error conectando a MongoDB:', error.message);
    return false;
  }
};

mongoose.connection.on('disconnected', () => {
  console.warn('⚠️  [Laboratorio Clínico] Conexión a MongoDB perdida');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ [Laboratorio Clínico] Error en conexión Mongoose:', err.message);
});

module.exports = {
  mongoose,
  connectMongoDB,
};
