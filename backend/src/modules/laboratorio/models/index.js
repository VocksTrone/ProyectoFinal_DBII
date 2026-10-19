const { mongoose } = require('../../../config/mongodb');

/**
 * Esquema: Paciente (Laboratorio Clínico - MongoDB)
 */
const PacienteLaboratorioSchema = new mongoose.Schema(
  {
    cui: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    nombres: {
      type: String,
      required: true,
      trim: true,
    },
    apellidos: {
      type: String,
      required: true,
      trim: true,
    },
    fecha_nacimiento: {
      type: Date,
      required: true,
    },
    genero: {
      type: String,
      enum: ['Masculino', 'Femenino', 'Otro'],
      required: true,
    },
    telefono: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
  },
  {
    timestamps: true,
    collection: 'pacientes',
  }
);

/**
 * Subdocumento Embebido: Resultado de Examen
 */
const ResultadoExamenSchema = new mongoose.Schema({
  parametro: {
    type: String,
    required: true, // ej: Hemoglobina, Glucosa, Leucocitos
  },
  valor_obtenido: {
    type: String,
    required: true,
  },
  unidad_medida: {
    type: String, // ej: mg/dL, g/dL, uL
    required: true,
  },
  rango_referencia: {
    type: String, // ej: "70 - 100 mg/dL"
    required: true,
  },
  alerta: {
    type: Boolean,
    default: false, // Indica si está fuera de rango
  },
  observacion: {
    type: String,
  },
});

/**
 * Esquema: Orden de Examen (Laboratorio Clínico - MongoDB)
 * - Referencia a Paciente
 * - Resultados Embebidos
 */
const OrdenExamenSchema = new mongoose.Schema(
  {
    codigo_orden: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
    },
    paciente_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PacienteLaboratorio',
      required: true,
    },
    tipo_examen: {
      type: String,
      required: true, // ej: Hematología Completa, Perfil Lipídico, Glucosa en Ayunas
    },
    medico_solicitante: {
      type: String,
      required: true,
    },
    institucion_origen: {
      type: String,
      default: 'Hospital General', // Hospital General, Centro Pediátrico, Clínica Odontológica, Externo
    },
    estado: {
      type: String,
      enum: ['pendiente', 'en_proceso', 'completado', 'cancelado'],
      default: 'pendiente',
    },
    fecha_toma_muestra: {
      type: Date,
      default: Date.now,
    },
    fecha_resultados: {
      type: Date,
    },
    // Patrón Embebido: Resultados de las pruebas de laboratorio
    resultados: [ResultadoExamenSchema],
    notas_laboratorista: {
      type: String,
    },
  },
  {
    timestamps: true,
    collection: 'ordenes_examen',
  }
);

const PacienteLaboratorio = mongoose.model('PacienteLaboratorio', PacienteLaboratorioSchema);
const OrdenExamen = mongoose.model('OrdenExamen', OrdenExamenSchema);

module.exports = {
  PacienteLaboratorio,
  OrdenExamen,
};
