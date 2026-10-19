const { PacienteHospital, MedicoHospital, ConsultaHospital } = require('../models');
const { pgPool } = require('../../../config/postgres');

class HospitalService {
  /**
   * Obtener estado y conteos rápidos del Hospital General
   */
  async getStatus() {
    return {
      institution: 'Hospital General',
      engine: 'PostgreSQL',
      status: 'active',
      description: 'Módulo de consultas externas, pacientes, diagnósticos y recetas (Modelo Relacional 3FN)',
    };
  }

  /**
   * Listar todos los pacientes
   */
  async getAllPacientes() {
    return await PacienteHospital.findAll({
      limit: 100,
      order: [['id_paciente', 'DESC']],
    });
  }

  /**
   * Registrar nuevo paciente
   */
  async createPaciente(data) {
    return await PacienteHospital.create(data);
  }

  /**
   * Listar consultas con información del paciente y médico
   */
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

  /**
   * Crear nueva consulta médica
   */
  async createConsulta(data) {
    return await ConsultaHospital.create(data);
  }

  /**
   * Ejecutar consulta SQL directa personalizada
   */
  async executeRawQuery(sql, params = []) {
    const result = await pgPool.query(sql, params);
    return result.rows;
  }
}

module.exports = new HospitalService();
