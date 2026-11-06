const { AppError } = require('../utils/helpers');

const texto = (v) => typeof v === 'string' && v.trim() !== '';

const fechaValida = (v) => /^\d{4}-\d{2}-\d{2}$/.test(v) && !isNaN(new Date(v).getTime());

const TIPOS_DIAGNOSTICO = ['presuntivo', 'definitivo'];

const validarPaciente = (d = {}) => {
  const errores = [];

  if (!texto(d.nombres)) errores.push({ field: 'nombres', message: 'Es obligatorio' });
  if (!texto(d.apellidos)) errores.push({ field: 'apellidos', message: 'Es obligatorio' });

  if (!fechaValida(d.fecha_nacimiento)) {
    errores.push({ field: 'fecha_nacimiento', message: 'Formato YYYY-MM-DD' });
  } else if (new Date(d.fecha_nacimiento) > new Date()) {
    errores.push({ field: 'fecha_nacimiento', message: 'No puede ser futura' });
  }

  if (!['M', 'F'].includes(d.sexo)) errores.push({ field: 'sexo', message: 'Debe ser M o F' });
  if (d.dpi && !/^\d{13}$/.test(d.dpi)) errores.push({ field: 'dpi', message: 'Debe tener 13 dígitos' });
  if (d.telefono && !/^\d{8}$/.test(d.telefono)) errores.push({ field: 'telefono', message: 'Debe tener 8 dígitos' });
  if (d.correo && !/^\S+@\S+\.\S+$/.test(d.correo)) errores.push({ field: 'correo', message: 'Correo inválido' });

  if (errores.length) throw new AppError('Datos del paciente inválidos', 400, errores);
};

const validarAtencion = (d = {}) => {
  const errores = [];

  if (!texto(d.motivo)) errores.push({ field: 'motivo', message: 'Es obligatorio' });

  if (d.diagnosticos !== undefined && !Array.isArray(d.diagnosticos)) {
    errores.push({ field: 'diagnosticos', message: 'Debe ser una lista' });
  }

  (Array.isArray(d.diagnosticos) ? d.diagnosticos : []).forEach((dx, i) => {
    if (!texto(dx.nombre)) errores.push({ field: `diagnosticos[${i}].nombre`, message: 'Es obligatorio' });
    if (dx.tipo && !TIPOS_DIAGNOSTICO.includes(dx.tipo)) {
      errores.push({ field: `diagnosticos[${i}].tipo`, message: 'presuntivo o definitivo' });
    }
    (dx.tratamientos || []).forEach((t, j) => {
      if (!texto(t.descripcion)) {
        errores.push({ field: `diagnosticos[${i}].tratamientos[${j}].descripcion`, message: 'Es obligatorio' });
      }
    });
  });

  if (d.receta) {
    const meds = d.receta.medicamentos;
    if (!Array.isArray(meds) || meds.length === 0) {
      errores.push({ field: 'receta.medicamentos', message: 'Debe tener al menos un medicamento' });
    } else {
      meds.forEach((m, i) => {
        if (!m.id_medicamento) errores.push({ field: `receta.medicamentos[${i}].id_medicamento`, message: 'Es obligatorio' });
        if (!texto(m.dosis)) errores.push({ field: `receta.medicamentos[${i}].dosis`, message: 'Es obligatorio' });
      });
    }
  }

  if (errores.length) throw new AppError('Datos de la atención inválidos', 400, errores);
};

const esHora = (v) => /^([01]\d|2[0-3]):[0-5]\d$/.test(v);
const esNumero = (v) => /^\d+$/.test(String(v));
const esObjeto = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);

// reglas: [[condición, campo, mensaje], ...]
const validar = (reglas) => {
  const errores = reglas.filter(([ok]) => !ok).map(([, field, message]) => ({ field, message }));
  if (errores.length) throw new AppError('Datos inválidos', 400, errores);
};

module.exports = {
  validarPaciente,
  validarAtencion,
  validar,
  texto,
  fechaValida,
  esHora,
  esNumero,
  esObjeto,
};
