const { AppError } = require('../utils/helpers');
const { validarPaciente, validarAtencion } = require('./validaciones');

// Reglas de negocio comunes. Recibe el adaptador del motor, nunca lo importa.
class PacientesService {
  async buscar(adaptador, texto = '') {
    return adaptador.buscarPacientes(String(texto).trim());
  }

  async crear(adaptador, datos) {
    validarPaciente(datos);
    return adaptador.crearPaciente(datos);
  }

  async obtener(adaptador, id) {
    const paciente = await adaptador.obtenerPaciente(id);
    if (!paciente) throw new AppError('Paciente no encontrado', 404);
    return paciente;
  }

  async historial(adaptador, id) {
    const historial = await adaptador.obtenerHistorial(id);
    if (!historial) throw new AppError('Paciente no encontrado', 404);
    return historial;
  }

  async archivar(adaptador, id, motivo) {
    if (typeof motivo !== 'string' || !motivo.trim()) {
      throw new AppError('El motivo de baja es obligatorio', 400);
    }
    const paciente = await this.obtener(adaptador, id);
    if (paciente.estado === 'archivado') throw new AppError('El paciente ya está archivado', 409);

    return adaptador.archivarPaciente(id, motivo.trim());
  }

  async registrarAtencion(adaptador, id, datos, usuario) {
    validarAtencion(datos);
    const paciente = await this.obtener(adaptador, id);
    if (paciente.estado === 'archivado') {
      throw new AppError('No se pueden registrar atenciones a un paciente archivado', 409);
    }

    return adaptador.registrarAtencion(id, datos, usuario);
  }

  async catalogo(adaptador, tipo) {
    const items = await adaptador.obtenerCatalogo(tipo);
    if (!items) throw new AppError(`Catálogo "${tipo}" no disponible`, 404);
    return items;
  }
}

module.exports = new PacientesService();
