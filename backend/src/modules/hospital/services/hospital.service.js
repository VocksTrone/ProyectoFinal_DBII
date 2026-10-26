const { PacienteHospital, MedicoHospital, ConsultaHospital } = require('../models');
const { pgPool } = require('../../../config/postgres');

class HospitalService {
  async getStatus() {
    return {
      institution: 'Hospital General',
      engine: 'PostgreSQL',
      status: 'active',
      description: 'Módulo de consultas externas, pacientes, diagnósticos y recetas (Modelo Relacional 3FN)',
    };
  }

  async getAllPacientes() {
    return await PacienteHospital.findAll({
      limit: 100,
      order: [['id_paciente', 'DESC']],
    });
  }

  async createPaciente(data) {
    return await PacienteHospital.create(data);
  }

  async getAllConsultas() {
    return await ConsultaHospital.findAll({
      include: [
        { model: PacienteHospital, as: 'paciente' },
        { model: MedicoHospital, as: 'medico' },
      ],
      limit: 50,
      order: [['fecha_consulta', 'DESC']],
    });
  }

  async createConsulta(data) {
    return await ConsultaHospital.create(data);
  }

  async executeRawQuery(sql, params = []) {
    const result = await pgPool.query(sql, params);
    return result.rows;
  }
}

module.exports = new HospitalService();
