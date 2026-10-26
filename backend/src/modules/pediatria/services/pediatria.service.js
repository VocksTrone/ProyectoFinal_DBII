const { TutorPediatria, PacientePediatrico, ControlCrecimiento } = require('../models');
const { mysqlPool } = require('../../../config/mysql');

class PediatriaService {
  async getStatus() {
    return {
      institution: 'Centro Médico Pediátrico',
      engine: 'MySQL',
      status: 'active',
      description: 'Módulo de tutores, pacientes pediátricos, controles de crecimiento y desarrollo',
    };
  }

  async getAllPacientes() {
    return await PacientePediatrico.findAll({
      include: [{ model: TutorPediatria, as: 'tutor' }],
      limit: 100,
      order: [['id_paciente', 'DESC']],
    });
  }

  async createPaciente(data) {
    return await PacientePediatrico.create(data);
  }

  async getAllTutores() {
    return await TutorPediatria.findAll({
      limit: 100,
      order: [['id_tutor', 'DESC']],
    });
  }

  async createTutor(data) {
    return await TutorPediatria.create(data);
  }

  async createControlCrecimiento(data) {
    return await ControlCrecimiento.create(data);
  }

  async executeRawQuery(sql, params = []) {
    const [rows] = await mysqlPool.query(sql, params);
    return rows;
  }
}

module.exports = new PediatriaService();
