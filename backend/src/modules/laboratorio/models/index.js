const { mongoose } = require('../../../config/mongodb');

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

const ResultadoExamenSchema = new mongoose.Schema({
  parametro: {
    type: String,
    required: true,
  },
  valor_obtenido: {
    type: String,
    required: true,
  },
  unidad_medida: {
    type: String,
    required: true,
  },
  rango_referencia: {
    type: String,
    required: true,
  },
  alerta: {
    type: Boolean,
    default: false,
  },
  observacion: {
    type: String,
  },
});

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
      required: true,
    },
    medico_solicitante: {
      type: String,
      required: true,
    },
    institucion_origen: {
      type: String,
      default: 'Hospital General',
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
