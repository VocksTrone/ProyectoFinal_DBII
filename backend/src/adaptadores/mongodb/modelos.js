// Modelos del Laboratorio Clínico (MongoDB)
const { mongoose } = require('../../config/mongodb');
const { Schema } = mongoose;

const Usuario = mongoose.model(
  'Usuario',
  new Schema(
    {
      usuario: { type: String, required: true, unique: true, lowercase: true, trim: true },
      nombre: { type: String, required: true },
      rol: { type: String, enum: ['medico', 'secretaria'], required: true },
      password_hash: { type: String, required: true },
      activo: { type: Boolean, default: true },
    },
    { collection: 'usuarios', timestamps: true }
  )
);

const pacienteSchema = new Schema(
  {
    dpi: { type: String, match: /^\d{13}$/ },
    nombres: { type: String, required: true, trim: true },
    apellidos: { type: String, required: true, trim: true },
    fecha_nacimiento: { type: Date, required: true },
    sexo: { type: String, enum: ['M', 'F'], required: true },
    contacto: { telefono: String, correo: String }, // embebido
    direccion: String,
    estado: { type: String, enum: ['activo', 'archivado'], default: 'activo' },
    baja: { motivo: String, fecha: Date },
    ultima_atencion: Date,
  },
  { collection: 'pacientes', timestamps: true }
);
// DPI único solo cuando viene
pacienteSchema.index({ dpi: 1 }, { unique: true, partialFilterExpression: { dpi: { $type: 'string' } } });
const Paciente = mongoose.model('Paciente', pacienteSchema);

const resultadoSchema = new Schema({
  codigo_examen: { type: String, required: true },
  tipo_examen: { type: String, required: true },
  categoria: String,
  estado: { type: String, enum: ['pendiente', 'validado'], default: 'pendiente' },
  valores: { type: Map, of: Schema.Types.Mixed }, // cambia según el examen
  rangos_referencia: String,
  observaciones: String,
  laboratorista: String,
  fecha_procesamiento: Date,
});

const OrdenExamen = mongoose.model(
  'OrdenExamen',
  new Schema(
    {
      codigo: { type: String, required: true, unique: true },
      paciente_id: { type: Schema.Types.ObjectId, ref: 'Paciente', required: true }, // referenciado
      medico_solicitante: { type: String, required: true },
      institucion_origen: String,
      motivo: String,
      notas: String,
      registrado_por: String,
      fecha_ingreso: { type: Date, default: Date.now },
      estado: { type: String, enum: ['pendiente', 'en_proceso', 'completada', 'cancelada'], default: 'pendiente' },
      resultados: [resultadoSchema], // embebidos
    },
    { collection: 'ordenes_examen', timestamps: true }
  )
);

const CatalogoExamen = mongoose.model(
  'CatalogoExamen',
  new Schema(
    {
      codigo: { type: String, required: true, unique: true },
      nombre: { type: String, required: true },
      categoria: { type: String, required: true },
      descripcion: String,
      preparacion: String,
      parametros: [{ _id: false, nombre: String, unidad: String, rango_referencia: String }],
    },
    { collection: 'catalogo_examenes' }
  )
);

// Correlativo de órdenes (LAB-000001)
const Contador = mongoose.model(
  'Contador',
  new Schema({ _id: String, valor: { type: Number, default: 0 } }, { collection: 'contadores', versionKey: false })
);

module.exports = {
  Usuario,
  Paciente,
  OrdenExamen,
  CatalogoExamen,
  Contador,
};
