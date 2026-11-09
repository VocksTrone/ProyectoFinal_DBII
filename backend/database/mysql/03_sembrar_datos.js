// =====================================================================
// Script de inicialización y siembra de datos para Centro Médico Pediátrico (MySQL)
// Uso desde backend/: node database/mysql/03_sembrar_datos.js
// =====================================================================

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const config = require('../../src/config/env');

const ejecutar = async () => {
  console.log('--- Inicializando base de datos Centro Médico Pediátrico (MySQL) ---');
  console.log(`Conectando a host: ${config.mysql.host}:${config.mysql.port}, base: ${config.mysql.database}...`);

  let connection;
  try {
    connection = await mysql.createConnection({
      host: config.mysql.host,
      port: config.mysql.port,
      database: config.mysql.database,
      user: config.mysql.username,
      password: config.mysql.password,
      multipleStatements: true,
      ...(config.mysql.ssl ? { ssl: { rejectUnauthorized: false } } : {}),
    });

    console.log('✓ Conexión establecida.');

    const rutaSchema = path.join(__dirname, '01_centro_pediatrico_schema.sql');
    const rutaDatos = path.join(__dirname, '02_centro_pediatrico_datos.sql');

    const schemaSql = fs.readFileSync(rutaSchema, 'utf8');
    const datosSql = fs.readFileSync(rutaDatos, 'utf8');

    console.log('Ejecutando esquema (tablas e índices)...');
    await connection.query(schemaSql);
    console.log('✓ Esquema creado exitosamente.');

    console.log('Insertando datos de prueba...');
    await connection.query(datosSql);
    console.log('✓ Datos de prueba insertados exitosamente.');

    console.log('\nUsuarios de prueba para login (@pediatria):');
    console.log('- Médico:     gchoc@pediatria     | Clave: Pediatria2026!');
    console.log('- Médico:     sestrada@pediatria  | Clave: Pediatria2026!');
    console.log('- Secretaria: sperez@pediatria    | Clave: Pediatria2026!');
    console.log('-----------------------------------------------------------------');
  } catch (error) {
    console.error('Error durante la inicialización:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};

if (require.main === module) {
  ejecutar();
}

module.exports = { ejecutar };

