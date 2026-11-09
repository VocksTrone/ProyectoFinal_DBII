const { getFirestore, isFirebaseReady } = require('../../../config/firebase');
const { AppError } = require('../../../utils/helpers');
const {
  PacienteModel,
  OdontologoModel,
  CitaModel,
  PagoModel,
  ESTADOS_CITA,
  ESTADOS_PAGO,
  METODOS_PAGO,
} = require('../models');

class OdontologiaService {
  async getStatus() {
    return {
      institution: 'Clínica Odontológica',
      engine: 'Firebase Firestore (NoSQL Documental)',
      status: isFirebaseReady() ? 'connected' : 'pending_credentials',
      collections: {
        pacientes: 'Documentos con subdocumentos embebidos (contacto, contacto_emergencia, historial_odontologico)',
        odontologos: 'Profesionales y especialistas activos',
        citas: 'Agenda odontológica con referencias foráneas (paciente_id, odontologo_id)',
        pagos: 'Gestión financiera con soporte para pagos mixtos (Efectivo/Tarjeta/Transferencia) y honorarios médicos',
      },
      supported_values: {
        estados_cita: ESTADOS_CITA,
        estados_pago: ESTADOS_PAGO,
        metodos_pago: METODOS_PAGO,
      },
    };
  }

  async getAllPacientes(limit = 100) {
    return PacienteModel.findAll(limit);
  }

  async getPacienteById(id) {
    const paciente = await PacienteModel.findById(id);
    if (!paciente) {
      throw new AppError(`Paciente con ID ${id} no encontrado`, 404);
    }
    return paciente;
  }

  async createPaciente(data) {
    if (data.dpi) {
      const existing = await PacienteModel.findByDpi(data.dpi);
      if (existing) {
        throw new AppError(`Ya existe un paciente registrado con el DPI "${data.dpi}" (ID: ${existing.id})`, 409);
      }
    }

    if (Array.isArray(data.historial_odontologico)) {
      for (const entry of data.historial_odontologico) {
        if (entry.odontologo_id) {
          const odontologo = await OdontologoModel.findById(entry.odontologo_id);
          if (!odontologo) {
            throw new AppError(`Odontólogo con ID "${entry.odontologo_id}" en historial no existe`, 404);
          }
        }
      }
    }

    return PacienteModel.create(data);
  }

  async updatePaciente(id, data) {
    return PacienteModel.update(id, data);
  }

  async addHistorialPaciente(pacienteId, historialData) {
    const paciente = await PacienteModel.findById(pacienteId);
    if (!paciente) {
      throw new AppError(`Paciente con ID "${pacienteId}" no encontrado`, 404);
    }

    if (historialData && historialData.odontologo_id) {
      const odontologo = await OdontologoModel.findById(historialData.odontologo_id);
      if (!odontologo) {
        throw new AppError(`Odontólogo referenciado con ID "${historialData.odontologo_id}" no existe`, 404);
      }
    }

    return PacienteModel.addHistorialEntry(pacienteId, historialData);
  }

  async getAllOdontologos(limit = 100) {
    return OdontologoModel.findAll(limit);
  }

  async getOdontologoById(id) {
    const odontologo = await OdontologoModel.findById(id);
    if (!odontologo) {
      throw new AppError(`Odontólogo con ID ${id} no encontrado`, 404);
    }
    return odontologo;
  }

  async createOdontologo(data) {
    if (data.colegiado_numero) {
      const existing = await OdontologoModel.findByColegiado(data.colegiado_numero);
      if (existing) {
        throw new AppError(`Ya existe un odontólogo registrado con el colegiado "${data.colegiado_numero}" (ID: ${existing.id})`, 409);
      }
    }
    return OdontologoModel.create(data);
  }

  async updateOdontologo(id, data) {
    return OdontologoModel.update(id, data);
  }

  async getAllCitas(filters = {}) {
    return CitaModel.findAll(filters);
  }

  async getCitaById(id) {
    const cita = await CitaModel.findById(id);
    if (!cita) {
      throw new AppError(`Cita con ID ${id} no encontrada`, 404);
    }
    return cita;
  }

  async createCita(data) {
    const paciente = await PacienteModel.findById(data.paciente_id);
    if (!paciente) {
      throw new AppError(`Paciente con ID "${data.paciente_id}" no existe en Firestore`, 404);
    }

    const odontologo = await OdontologoModel.findById(data.odontologo_id);
    if (!odontologo) {
      throw new AppError(`Odontólogo con ID "${data.odontologo_id}" no existe en Firestore`, 404);
    }

    return CitaModel.create(data);
  }

  async updateCita(id, data) {
    if (data.paciente_id) {
      const paciente = await PacienteModel.findById(data.paciente_id);
      if (!paciente) throw new AppError(`Paciente con ID "${data.paciente_id}" no existe`, 404);
    }
    if (data.odontologo_id) {
      const odontologo = await OdontologoModel.findById(data.odontologo_id);
      if (!odontologo) throw new AppError(`Odontólogo con ID "${data.odontologo_id}" no existe`, 404);
    }
    return CitaModel.update(id, data);
  }

  async updateEstadoCita(id, estado) {
    return CitaModel.updateEstado(id, estado);
  }

  async getAllPagos(filters = {}) {
    return PagoModel.findAll(filters);
  }

  async getPagoById(id) {
    const pago = await PagoModel.findById(id);
    if (!pago) {
      throw new AppError(`Pago con ID ${id} no encontrado`, 404);
    }
    return pago;
  }

  async getPagosByCita(citaId) {
    return PagoModel.findByCitaId(citaId);
  }

  async getPagosByPaciente(pacienteId) {
    return PagoModel.findByPacienteId(pacienteId);
  }

  async createPago(data) {
    const paciente = await PacienteModel.findById(data.paciente_id);
    if (!paciente) {
      throw new AppError(`Paciente referenciado con ID "${data.paciente_id}" no existe en Firestore`, 404);
    }

    const cita = await CitaModel.findById(data.cita_id);
    if (!cita) {
      throw new AppError(`Cita referenciada con ID "${data.cita_id}" no existe en Firestore`, 404);
    }

    const odontologoId = data.honorarios_medicos?.odontologo_id || cita.odontologo_id;
    if (odontologoId) {
      const odontologo = await OdontologoModel.findById(odontologoId);
      if (!odontologo) {
        throw new AppError(`Odontólogo referenciado en honorarios con ID "${odontologoId}" no existe en Firestore`, 404);
      }
    }

    // Sin odontólogo en los honorarios se toma el de la cita
    if (data.honorarios_medicos && !data.honorarios_medicos.odontologo_id) {
      data.honorarios_medicos.odontologo_id = cita.odontologo_id;
    }

    const nuevoPago = await PagoModel.create(data);

    // Con el pago completado la cita queda como atendida
    if (nuevoPago.estado_pago === 'Completado' && cita.estado !== 'Atendida') {
      await CitaModel.update(cita.id, { estado: 'Atendida' });
    }

    return nuevoPago;
  }

  async updatePago(id, data) {
    return PagoModel.update(id, data);
  }
}

module.exports = new OdontologiaService();
