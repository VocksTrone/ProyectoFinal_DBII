const pediatriaAdapter = require('../../../adaptadores/mysql/pediatria');
const { mysqlPool } = require('../../../config/mysql');

class PediatriaService {
  async getStatus() {
    return {
      institution: 'Centro Médico Pediátrico',
      engine: 'MySQL (InnoDB)',
      status: 'active',
      description: 'Módulo de tutores, pacientes pediátricos, controles de crecimiento y desarrollo',
    };
  }

  async getAllPacientes(buscar = '') {
    const [rows] = await mysqlPool.query(
      `SELECT p.*, e.nombres as tutor_nombres, e.apellidos as tutor_apellidos, e.telefono as tutor_telefono
       FROM paciente p
       LEFT JOIN encargado e ON e.id_encargado = p.id_encargado
       WHERE ? = '' OR CONCAT(p.nombres, ' ', p.apellidos) LIKE CONCAT('%', ?, '%')
       ORDER BY p.id_paciente DESC
       LIMIT 100`,
      [buscar, buscar]
    );
    return rows;
  }

  async createPaciente(data) {
    const adp = require('../../../adaptadores').obtenerAdaptador('pediatria');
    return adp.crearPaciente(data);
  }

  async getAllTutores(buscar = '') {
    return pediatriaAdapter.listarTutores(buscar);
  }

  async createTutor(data) {
    return pediatriaAdapter.crearTutor(data);
  }

  async createControlCrecimiento(data) {
    return pediatriaAdapter.registrarControlCrecimiento(data.id_paciente, data);
  }

  async executeRawQuery(sql, params = []) {
    const [rows] = await mysqlPool.query(sql, params);
    return rows;
  }
}

module.exports = new PediatriaService();
