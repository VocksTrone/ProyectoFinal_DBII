const { Sequelize } = require('sequelize');
const mysql = require('mysql2/promise');
const config = require('./env');

const dialectOptions = config.mysql.ssl
  ? {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    }
  : {};

const sequelizeMySQL = new Sequelize(
  config.mysql.database,
  config.mysql.username,
  config.mysql.password,
  {
    host: config.mysql.host,
    port: config.mysql.port,
    dialect: 'mysql',
    logging: config.mysql.logging ? console.log : false,
    dialectOptions,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  }
);

const mysqlPool = mysql.createPool({
  host: config.mysql.host,
  port: config.mysql.port,
  database: config.mysql.database,
  user: config.mysql.username,
  password: config.mysql.password,
  ...(config.mysql.ssl ? { ssl: { rejectUnauthorized: false } } : {}),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

const connectMySQL = async () => {
  try {
    await sequelizeMySQL.authenticate();
    console.log('[Centro Pediátrico] Conectado exitosamente a MySQL');
    return true;
  } catch (error) {
    console.error('[Centro Pediátrico] Error conectando a MySQL:', error.message);
    return false;
  }
};

module.exports = {
  sequelizeMySQL,
  mysqlPool,
  connectMySQL,
};
