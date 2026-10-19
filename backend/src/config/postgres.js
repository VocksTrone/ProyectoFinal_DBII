const { Sequelize } = require('sequelize');
const { Pool } = require('pg');
const config = require('./env');

// Instancia de Sequelize para Hospital General
const sequelizePostgres = new Sequelize(
  config.postgres.database,
  config.postgres.username,
  config.postgres.password,
  {
    host: config.postgres.host,
    port: config.postgres.port,
    dialect: 'postgres',
    logging: config.postgres.logging ? console.log : false,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  }
);

// Pool nativo de pg para consultas SQL directas cuando sea necesario
const pgPool = new Pool({
  host: config.postgres.host,
  port: config.postgres.port,
  database: config.postgres.database,
  user: config.postgres.username,
  password: config.postgres.password,
});

/**
 * Conectar y verificar conexión a PostgreSQL (Hospital General)
 */
const connectPostgres = async () => {
  try {
    await sequelizePostgres.authenticate();
    console.log('✅ [Hospital General] Conectado exitosamente a PostgreSQL');
    return true;
  } catch (error) {
    console.error('❌ [Hospital General] Error conectando a PostgreSQL:', error.message);
    return false;
  }
};

module.exports = {
  sequelizePostgres,
  pgPool,
  connectPostgres,
};
