const hospital = require('../../../adaptadores/postgres/hospital');
const { validar, texto, fechaValida, esHora, esNumero } = require('../../../core/validaciones');
const { asyncHandler, sendSuccess, AppError } = require('../../../utils/helpers');

const ESTADOS_INTERNAMIENTO = ['activo', 'dado de alta', 'todos'];

// El id de la URL debe ser numérico
const idValido = (id, nombre) => {
  if (!esNumero(id)) throw new AppError(`${nombre} no encontrado`, 404);
};

class HospitalController {
  // ---------- Citas ----------

  listarCitas = asyncHandler(async (req, res) => {
    const q = req.query;
    validar([
      [!q.fecha || fechaValida(q.fecha), 'fecha', 'Formato YYYY-MM-DD'],
      [!q.id_medico || esNumero(q.id_medico), 'id_medico', 'Debe ser numérico'],
      [!q.id_paciente || esNumero(q.id_paciente), 'id_paciente', 'Debe ser numérico'],
    ]);
    return sendSuccess(res, await hospital.listarCitas(q), 'Agenda obtenida');
  });

  agendarCita = asyncHandler(async (req, res) => {
    const b = req.body;
    validar([
      [esNumero(b.id_paciente), 'id_paciente', 'Es obligatorio'],
      [esNumero(b.id_medico), 'id_medico', 'Es obligatorio'],
      [fechaValida(b.fecha), 'fecha', 'Formato YYYY-MM-DD'],
      [esHora(b.hora), 'hora', 'Formato HH:MM'],
    ]);
    return sendSuccess(res, await hospital.agendarCita(b), 'Cita agendada', 201);
  });

  reprogramarCita = asyncHandler(async (req, res) => {
    idValido(req.params.id, 'Cita');
    validar([
      [fechaValida(req.body.fecha), 'fecha', 'Formato YYYY-MM-DD'],
      [esHora(req.body.hora), 'hora', 'Formato HH:MM'],
    ]);
    return sendSuccess(res, await hospital.reprogramarCita(req.params.id, req.body), 'Cita reprogramada');
  });

  cancelarCita = asyncHandler(async (req, res) => {
    idValido(req.params.id, 'Cita');
    return sendSuccess(res, await hospital.cancelarCita(req.params.id), 'Cita cancelada');
  });

  // ---------- Antecedentes ----------

  agregarAntecedente = asyncHandler(async (req, res) => {
    idValido(req.params.id, 'Paciente');
    validar([[texto(req.body.tipo), 'tipo', 'Es obligatorio (alergia, enfermedad crónica, cirugía...)']]);
    const data = await hospital.agregarAntecedente(req.params.id, req.body);
    return sendSuccess(res, data, 'Antecedente registrado', 201);
  });

  // ---------- Internamientos ----------

  listarInternamientos = asyncHandler(async (req, res) => {
    const estado = req.query.estado || 'activo';
    validar([[ESTADOS_INTERNAMIENTO.includes(estado), 'estado', ESTADOS_INTERNAMIENTO.join(', ')]]);
    return sendSuccess(res, await hospital.listarInternamientos({ estado }), 'Internamientos obtenidos');
  });

  obtenerInternamiento = asyncHandler(async (req, res) => {
    const data = await hospital.obtenerInternamiento(req.params.id);
    if (!data) throw new AppError('Internamiento no encontrado', 404);
    // Prescripciones = información restringida (solo médicos)
    if (req.user.rol !== 'medico') data.medicamentos = null;
    return sendSuccess(res, data, 'Internamiento obtenido');
  });

  internar = asyncHandler(async (req, res) => {
    validar([
      [esNumero(req.body.id_paciente), 'id_paciente', 'Es obligatorio'],
      [texto(req.body.motivo), 'motivo', 'Es obligatorio'],
    ]);
    const data = await hospital.internar(req.body, req.user);
    return sendSuccess(res, data, 'Paciente internado', 201);
  });

  agregarMedicamento = asyncHandler(async (req, res) => {
    idValido(req.params.id, 'Internamiento');
    const b = req.body;
    validar([
      [esNumero(b.id_medicamento), 'id_medicamento', 'Es obligatorio'],
      [texto(b.dosis), 'dosis', 'Es obligatoria'],
      [!b.fecha_inicio || fechaValida(b.fecha_inicio), 'fecha_inicio', 'Formato YYYY-MM-DD'],
      [!b.fecha_fin || fechaValida(b.fecha_fin), 'fecha_fin', 'Formato YYYY-MM-DD'],
    ]);
    const data = await hospital.agregarMedicamentoInternamiento(req.params.id, b);
    return sendSuccess(res, data, 'Medicamento agregado', 201);
  });

  agregarDieta = asyncHandler(async (req, res) => {
    idValido(req.params.id, 'Internamiento');
    const b = req.body;
    validar([
      [esNumero(b.id_tipo_dieta), 'id_tipo_dieta', 'Es obligatorio'],
      [!b.fecha_inicio || fechaValida(b.fecha_inicio), 'fecha_inicio', 'Formato YYYY-MM-DD'],
      [!b.fecha_fin || fechaValida(b.fecha_fin), 'fecha_fin', 'Formato YYYY-MM-DD'],
    ]);
    const data = await hospital.agregarDieta(req.params.id, b);
    return sendSuccess(res, data, 'Dieta asignada', 201);
  });

  darAlta = asyncHandler(async (req, res) => {
    idValido(req.params.id, 'Internamiento');
    return sendSuccess(res, await hospital.darAlta(req.params.id), 'Paciente dado de alta');
  });
}

module.exports = new HospitalController();
