// Utilidades del Laboratorio

export const ESTADO_ORDEN: Record<string, { clase: string; texto: string }> = {
  pendiente: { clase: "recibida", texto: "Pendiente" },
  en_proceso: { clase: "en-proceso", texto: "En proceso" },
  completada: { clase: "validada", texto: "Completada" },
  cancelada: { clase: "cancelada", texto: "Cancelada" },
};

const NUMERO = /^-?\d+([.,]\d+)?$/;

// "13,5" -> 13.5 ; "Negativo" -> "Negativo"
export const aValor = (texto: string): string | number => {
  const t = texto.trim();
  return NUMERO.test(t) ? Number(t.replace(",", ".")) : t;
};

// true = fuera de rango, false = normal, null = no se puede evaluar
export const fueraDeRango = (valor: string | number | undefined, rango: string): boolean | null => {
  if (valor === undefined || valor === "") return null;
  const r = rango.trim();
  const v = typeof valor === "number" ? valor : NUMERO.test(String(valor).trim()) ? Number(String(valor).replace(",", ".")) : null;

  const entre = r.match(/^(-?[\d.]+)\s*-\s*(-?[\d.]+)$/);
  if (entre && v !== null) return v < Number(entre[1]) || v > Number(entre[2]);

  const limite = r.match(/^([<>])\s*(-?[\d.]+)$/);
  if (limite && v !== null) return limite[1] === "<" ? v >= Number(limite[2]) : v <= Number(limite[2]);

  // Rangos de texto (ej. "Negativo"); los que tienen opciones no se evalúan
  if (!/[\d/]/.test(r) && v === null) return String(valor).trim().toLowerCase() !== r.toLowerCase();
  return null;
};

export const INSTITUCIONES_ORIGEN = ["Hospital General", "Centro Médico Pediátrico", "Clínica Odontológica", "Médico particular", "Otra institución"];
