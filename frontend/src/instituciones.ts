import type { Institucion, Rol } from "./api/tipos";
import type { IconName } from "./ui/componentes";
import type { Pagina } from "./navegacion";

type Config = {
  nombre: string;
  motor: string;
  atencion: string; // cómo se llama una "atención" en esa institución
  pestanas: string[];
  menu: { pagina: Pagina; etiqueta: string; icono: IconName }[];
  catalogoAtencion: string;
};

// La interfaz es la misma para todas; solo cambian nombres y pestañas propias
export const INSTITUCIONES: Record<Institucion, Config> = {
  hospital: {
    nombre: "Hospital General",
    motor: "PostgreSQL",
    atencion: "consulta",
    pestanas: ["Resumen", "Consultas", "Diagnósticos y tratamientos", "Recetas", "Antecedentes", "Internamientos"],
    menu: [
      { pagina: "agenda", etiqueta: "Agenda", icono: "calendar" },
      { pagina: "internamientos", etiqueta: "Internamientos", icono: "heart" },
    ],
    catalogoAtencion: "medicamentos",
  },
  laboratorio: {
    nombre: "Laboratorio Clínico",
    motor: "MongoDB",
    atencion: "orden de examen",
    pestanas: ["Resumen", "Órdenes y resultados"],
    menu: [{ pagina: "ordenes", etiqueta: "Órdenes del día", icono: "flask" }],
    catalogoAtencion: "examenes",
  },
  pediatria: {
    nombre: "Centro Médico Pediátrico",
    motor: "MySQL",
    atencion: "consulta",
    pestanas: ["Resumen", "Consultas", "Diagnósticos y tratamientos", "Recetas", "Antecedentes"],
    menu: [],
    catalogoAtencion: "medicamentos",
  },
  odontologia: {
    nombre: "Clínica Odontológica",
    motor: "Firebase",
    atencion: "consulta",
    pestanas: ["Resumen", "Consultas", "Diagnósticos y tratamientos"],
    menu: [],
    catalogoAtencion: "tratamientos",
  },
};

// Pestañas con información restringida (solo personal médico)
export const PESTANAS_RESTRINGIDAS = ["Consultas", "Diagnósticos y tratamientos", "Recetas", "Antecedentes", "Órdenes y resultados"];

export const nombreRol = (rol: Rol, institucion: Institucion) => {
  if (rol === "secretaria") return "Secretaria";
  if (institucion === "laboratorio") return "Laboratorista";
  if (institucion === "odontologia") return "Odontólogo";
  return "Médico";
};
