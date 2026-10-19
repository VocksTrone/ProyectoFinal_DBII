const app = require('./app');
const config = require('./config/env');

const { connectPostgres } = require('./config/postgres');
const { connectMySQL } = require('./config/mysql');
const { initFirebase } = require('./config/firebase');
const { connectMongoDB } = require('./config/mongodb');

/**
 * Función principal para iniciar conexiones a bases de datos y servidor HTTP
 */
const startServer = async () => {
  console.log('================================================================');
  console.log('🚀 Iniciando Backend - Red de Instituciones Médicas (DB II)');
  console.log(`🌍 Entorno: ${config.env} | Puerto: ${config.port}`);
  console.log('================================================================');

  // Inicializar conexiones a las 4 bases de datos de forma paralela y resiliente
  console.log('🔌 Conectando a los motores de base de datos...');

  const dbConnectionPromises = [
    // 1. PostgreSQL (Hospital General)
    connectPostgres().catch((err) => {
      console.warn('⚠️  [PostgreSQL] Conexión pendiente:', err.message);
      return false;
    }),

    // 2. MySQL (Centro Pediátrico)
    connectMySQL().catch((err) => {
      console.warn('⚠️  [MySQL] Conexión pendiente:', err.message);
      return false;
    }),

    // 3. Firebase (Clínica Odontológica)
    Promise.resolve().then(() => {
      initFirebase();
      return true;
    }),

    // 4. MongoDB (Laboratorio Clínico)
    connectMongoDB().catch((err) => {
      console.warn('⚠️  [MongoDB] Conexión pendiente:', err.message);
      return false;
    }),
  ];

  await Promise.allSettled(dbConnectionPromises);

  // Iniciar servidor HTTP
  const server = app.listen(config.port, () => {
    console.log('================================================================');
    console.log(`✅ Servidor Express activo en: http://localhost:${config.port}`);
    console.log(`🩺 Health Check: http://localhost:${config.port}/api/health`);
    console.log(`🏥 1. Hospital General:     http://localhost:${config.port}/api/hospital`);
    console.log(`👶 2. Centro Pediátrico:    http://localhost:${config.port}/api/pediatria`);
    console.log(`🦷 3. Clínica Odontológica: http://localhost:${config.port}/api/odontologia`);
    console.log(`🔬 4. Laboratorio Clínico:  http://localhost:${config.port}/api/laboratorio`);
    console.log('================================================================');
  });

  // Manejo de apagado elegante (Graceful Shutdown)
  const shutdown = () => {
    console.log('\n🛑 Recibida señal de apagado, cerrando servidor HTTP...');
    server.close(() => {
      console.log('Servidor finalizado limpiamente.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
};

startServer().catch((error) => {
  console.error('💥 Error crítico al arrancar la aplicación:', error);
  process.exit(1);
});
