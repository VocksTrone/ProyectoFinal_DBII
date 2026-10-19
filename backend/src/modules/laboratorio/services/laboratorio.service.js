const { PacienteLaboratorio, OrdenExamen } = require('../models');

class LaboratorioService {
  /**
   * Estado del módulo Laboratorio Clínico
   */
  async getStatus() {
    return {
      institution: 'Laboratorio Clínico',
      engine: 'MongoDB (Mongoose)',
      status: 'active',
      collections: ['pacientes', 'ordenes_examen (con resultados embebidos)'],
      description: 'Módulo de análisis clínicos, órdenes de examen y resultados diagnósticos',
    };
  }

  /**
   * Listar pacientes del laboratorio
   */
  async getAllPacientes() {
    return await PacienteLaboratorio.find().sort({ createdAt: -1 }).limit(100);
  }

  /**
   * Registrar paciente en laboratorio
   */
  async createPaciente(data) {
    const paciente = new PacienteLaboratorio(data);
    return await paciente.save();
  }

  /**
   * Listar órdenes de examen con datos del paciente poblados
   */
  async getAllOrdenes() {
    return await OrdenExamen.find()
      .populate('paciente_id')
      .sort({ createdAt: -1 })
      .limit(50);
  }

  /**
   * Crear nueva orden de examen con resultados embebidos
   */
  async createOrden(data) {
    const orden = new OrdenExamen(data);
    return await orden.save();
  }

  /**
   * Agregar o actualizar resultados embebidos a una orden
   */
  async addResultados(ordenId, resultados) {
    return await OrdenExamen.findByIdAndUpdate(
      ordenId,
      {
        $push: { resultados: { $each: resultados } },
        estado: 'completado',
        fecha_resultados: new Date(),
      },
      { new: true, runValidators: true }
    );
  }
}

module.exports = new LaboratorioService();
