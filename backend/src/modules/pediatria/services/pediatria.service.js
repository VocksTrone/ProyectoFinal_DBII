const { TutorPediatria, PacientePediatrico, ControlCrecimiento } = require('../models');
const { mysqlPool } = require('../../../config/mysql');

class PediatriaService {
  /**
   * Obtener estado del Centro Pediátrico
   */
  async getStatus() {
    return {
      institution: 'Centro Médico Pediátrico',
      engine: 'MySQL',
      status: 'active',
      description: 'Módulo de tutores, pacientes pediátricos, controles de crecimiento y desarrollo',
    };
  }

  /**
   * Listar todos los pacientes pediátricos con su tutor
   */
  async getAllPacientes() {
    return await PacientePediatrico.findAll({
      include: [{ model: TutorPediatria, as: 'tutor' }],
      limit: 100,
      order: [['id_paciente', 'DESC']],
    });
  }

  /**
   * Registrar nuevo paciente pediátrico
   */
  async createPaciente(data) {
    return await PacientePediatrico.create(data);
  }

  /**
   * Listar tutores
   */
  async getAllTutores() {
    return await TutorPediatria.findAll({
      limit: 100,
      order: [['id_tutor', 'DESC']],
    });
  }

  /**
   * Registrar nuevo tutor
   */
  async createTutor(data) {
    return await TutorPediatria.create(data);
  }

  /**
   * Registrar control de crecimiento
   */
  async createControlCrecimiento(data) {
    return await ControlCrecimiento.create(data);
  }

  /**
   * Ejecutar consulta SQL directa personalizada
   */
  async executeRawQuery(sql, params = []) {
    const [rows] = await mysqlPool.query(sql, params);
    return rows;
  }
}

module.exports = new PediatriaService();
