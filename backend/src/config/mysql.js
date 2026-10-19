const { Sequelize } = require('sequelize');
const mysql = require('mysql2/promise');
const config = require('./env');

// Instancia de Sequelize para Centro Pediátrico
const sequelizeMySQL = new Sequelize(
  config.mysql.database,
  config.mysql.username,
  config.mysql.password,
  {
    host: config.mysql.host,
    port: config.mysql.port,
    dialect: 'mysql',
    logging: config.mysql.logging ? console.log : false,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  }
);

// Pool nativo de MySQL2 para consultas SQL directas cuando sea necesario
const mysqlPool = mysql.createPool({
  host: config.mysql.host,
  port: config.mysql.port,
  database: config.mysql.database,
  user: config.mysql.username,
  password: config.mysql.password,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

/**
 * Conectar y verificar conexión a MySQL (Centro Pediátrico)
 */
const connectMySQL = async () => {
  try {
    await sequelizeMySQL.authenticate();
    console.log('✅ [Centro Pediátrico] Conectado exitosamente a MySQL');
    return true;
  } catch (error) {
    console.error('❌ [Centro Pediátrico] Error conectando a MySQL:', error.message);
    return false;
  }
};

module.exports = {
  sequelizeMySQL,
  mysqlPool,
  connectMySQL,
};
