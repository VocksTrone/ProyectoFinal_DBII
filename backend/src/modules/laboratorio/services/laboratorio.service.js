const { PacienteLaboratorio, OrdenExamen } = require('../models');

class LaboratorioService {
  async getStatus() {
    return {
      institution: 'Laboratorio Clínico',
      engine: 'MongoDB (Mongoose)',
      status: 'active',
      collections: ['pacientes', 'ordenes_examen (con resultados embebidos)'],
      description: 'Módulo de análisis clínicos, órdenes de examen y resultados diagnósticos',
    };
  }

  async getAllPacientes() {
    return await PacienteLaboratorio.find().sort({ createdAt: -1 }).limit(100);
  }

  async createPaciente(data) {
    const paciente = new PacienteLaboratorio(data);
    return await paciente.save();
  }

  async getAllOrdenes() {
    return await OrdenExamen.find()
      .populate('paciente_id')
      .sort({ createdAt: -1 })
      .limit(50);
  }

  async createOrden(data) {
    const orden = new OrdenExamen(data);
    return await orden.save();
  }

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
