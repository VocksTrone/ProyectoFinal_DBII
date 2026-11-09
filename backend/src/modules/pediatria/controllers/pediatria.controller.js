const pediatria = require('../../../adaptadores/mysql/pediatria');
const { obtenerAdaptador } = require('../../../adaptadores');
const { validar, texto, esNumero } = require('../../../core/validaciones');
const { asyncHandler, sendSuccess, AppError } = require('../../../utils/helpers');

const idValido = (id, nombre = 'Recurso') => {
  if (!esNumero(id)) throw new AppError(`${nombre} no encontrado`, 404);
};

class PediatriaController {
  getStatus = asyncHandler(async (req, res) => {
    return sendSuccess(res, {
      institution: 'Centro Médico Pediátrico',
      engine: 'MySQL (InnoDB)',
      status: 'active',
      description: 'Módulo de tutores, pacientes pediátricos, curvas de crecimiento y carné de vacunas',
    }, 'Información del módulo Centro Médico Pediátrico');
  });


  listarTutores = asyncHandler(async (req, res) => {
    const tutores = await pediatria.listarTutores(req.query.buscar);
    return sendSuccess(res, tutores, 'Lista de tutores obtenida');
  });

  obtenerTutor = asyncHandler(async (req, res) => {
    idValido(req.params.id, 'Tutor');
    const tutor = await pediatria.obtenerTutor(req.params.id);
    if (!tutor) throw new AppError('Tutor no encontrado', 404);
    return sendSuccess(res, tutor, 'Información del tutor obtenida');
  });

  crearTutor = asyncHandler(async (req, res) => {
    const b = req.body;
    validar([
      [texto(b.nombres), 'nombres', 'Es obligatorio'],
      [texto(b.apellidos), 'apellidos', 'Es obligatorio'],
      [texto(b.parentesco), 'parentesco', 'Es obligatorio'],
      [texto(b.telefono), 'telefono', 'Es obligatorio'],
    ]);
    const nuevoTutor = await pediatria.crearTutor(b);
    return sendSuccess(res, nuevoTutor, 'Tutor registrado con éxito', 201);
  });


  obtenerControles = asyncHandler(async (req, res) => {
    idValido(req.params.id, 'Paciente');
    const controles = await pediatria.obtenerControlesCrecimiento(req.params.id);
    return sendSuccess(res, controles, 'Controles de crecimiento obtenidos');
  });

  registrarControl = asyncHandler(async (req, res) => {
    idValido(req.params.id, 'Paciente');
    const b = req.body;
    const peso = b.peso_kg !== undefined ? b.peso_kg : b.peso;
    const talla = b.talla_cm !== undefined ? b.talla_cm : b.talla;

    validar([
      [peso !== undefined && peso !== null && !isNaN(Number(peso)) && Number(peso) > 0, 'peso', 'Debe ser un valor numérico mayor a 0'],
      [talla !== undefined && talla !== null && !isNaN(Number(talla)) && Number(talla) > 0, 'talla', 'Debe ser un valor numérico mayor a 0'],
    ]);

    const control = await pediatria.registrarControlCrecimiento(req.params.id, b);
    return sendSuccess(res, control, 'Control de crecimiento registrado con éxito', 201);
  });


  listarVacunas = asyncHandler(async (req, res) => {
    const vacunas = await pediatria.listarVacunas();
    return sendSuccess(res, vacunas, 'Catálogo de vacunas obtenido');
  });

  obtenerEsquema = asyncHandler(async (req, res) => {
    idValido(req.params.id, 'Paciente');
    const esquema = await pediatria.obtenerEsquemaVacunacion(req.params.id);
    if (!esquema) throw new AppError('Paciente no encontrado', 404);
    return sendSuccess(res, esquema, 'Esquema de vacunación obtenido');
  });

  registrarVacuna = asyncHandler(async (req, res) => {
    idValido(req.params.id, 'Paciente');
    const b = req.body;
    validar([
      [esNumero(b.id_vacuna), 'id_vacuna', 'Es obligatorio y debe ser numérico'],
    ]);

    const registro = await pediatria.registrarVacunacion(req.params.id, b, req.user);
    return sendSuccess(res, registro, 'Dosis de vacuna registrada con éxito', 201);
  });


  getPacientes = asyncHandler(async (req, res) => {
    const adp = obtenerAdaptador('pediatria');
    const pacientes = await adp.buscarPacientes(req.query.buscar || '');
    return sendSuccess(res, pacientes, 'Lista de pacientes pediátricos obtenida');
  });

  createPaciente = asyncHandler(async (req, res) => {
    const adp = obtenerAdaptador('pediatria');
    const nuevo = await adp.crearPaciente(req.body);
    return sendSuccess(res, nuevo, 'Paciente pediátrico registrado con éxito', 201);
  });

  getTutores = this.listarTutores;
  createTutor = this.crearTutor;

  createControl = asyncHandler(async (req, res) => {
    const idPaciente = req.body.id_paciente;
    if (!idPaciente) throw new AppError('id_paciente es obligatorio', 400);
    const control = await pediatria.registrarControlCrecimiento(idPaciente, req.body);
    return sendSuccess(res, control, 'Control de crecimiento registrado con éxito', 201);
  });
}

module.exports = new PediatriaController();
