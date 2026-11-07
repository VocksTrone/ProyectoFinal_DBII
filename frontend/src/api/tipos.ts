// Formatos del contrato común (docs/contrato-api.md)

export type Institucion = "hospital" | "laboratorio" | "pediatria" | "odontologia";
export type Rol = "medico" | "secretaria";

export type Usuario = {
  id: string;
  nombre: string;
  rol: Rol;
  institucion: Institucion;
};

export type Paciente = {
  id: string;
  dpi: string | null;
  nombres: string;
  apellidos: string;
  fecha_nacimiento: string;
  sexo: "M" | "F";
  telefono: string | null;
  correo: string | null;
  direccion: string | null;
  estado: "activo" | "archivado";
  extra: Record<string, any>;
};

export type NuevoPaciente = Omit<Paciente, "id" | "estado" | "extra"> & { extra?: Record<string, any> };

export type Tratamiento = {
  id?: string;
  descripcion: string;
  duracion_dias?: number | null;
  fecha_inicio?: string | null;
  fecha_fin?: string | null;
};

export type Diagnostico = {
  id?: string;
  nombre: string;
  tipo: "presuntivo" | "definitivo";
  codigo?: string | null;
  descripcion?: string | null;
  fecha?: string;
  tratamientos: Tratamiento[];
};

export type MedicamentoRecetado = {
  id_medicamento: string;
  nombre?: string;
  presentacion?: string;
  dosis: string;
  frecuencia?: string | null;
  via?: string | null;
  duracion_dias?: number | null;
  indicaciones?: string | null;
};

export type Receta = { id: string; codigo: string; fecha: string; medicamentos: MedicamentoRecetado[] };

export type Atencion = {
  id: string;
  fecha: string;
  profesional: string;
  motivo: string | null;
  notas: string | null;
  diagnosticos: Diagnostico[];
  receta: Receta | null;
  extra: Record<string, any>;
};

export type Antecedente = { id: string; tipo: string; descripcion: string | null; fecha: string };

export type Historial = {
  paciente: Paciente;
  antecedentes: Antecedente[];
  atenciones: Atencion[];
  extra?: Record<string, any>;
};

// Laboratorio
export type ExamenOrden = {
  id: string;
  codigo_examen: string;
  tipo_examen: string;
  categoria: string;
  estado: "pendiente" | "validado";
  valores?: Record<string, string | number>;
  rangos_referencia: string | null;
  observaciones?: string | null;
  laboratorista: string | null;
  fecha_procesamiento: string | null;
  parametros?: ParametroExamen[];
};

export type ParametroExamen = { nombre: string; unidad: string; rango_referencia: string };

export type ExamenCatalogo = {
  id: string;
  codigo: string;
  nombre: string;
  categoria: string;
  descripcion?: string;
  preparacion?: string;
  parametros: ParametroExamen[];
};

export type ItemCatalogo = { id: string; nombre: string; [campo: string]: any };
