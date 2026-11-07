// Cliente del API: agrega el token y convierte los errores en mensajes claros

const BASE = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

export type DetalleError = { field?: string; message: string };

export class ApiError extends Error {
  status: number;
  details: DetalleError[];

  constructor(status: number, message: string, details: DetalleError[] = []) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

let token: string | null = null;
let alExpirar: () => void = () => undefined;

export const fijarToken = (nuevo: string | null) => {
  token = nuevo;
};

// Se llama cuando el backend responde 401 (token vencido o inválido)
export const alExpirarSesion = (fn: () => void) => {
  alExpirar = fn;
};

async function pedir<T>(metodo: string, ruta: string, cuerpo?: unknown): Promise<T> {
  let respuesta: Response;
  try {
    respuesta = await fetch(BASE + ruta, {
      method: metodo,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
    });
  } catch {
    throw new ApiError(0, "No se pudo conectar con el servidor. ¿Está encendido el backend?");
  }

  const json = await respuesta.json().catch(() => ({}));
  if (!respuesta.ok) {
    if (respuesta.status === 401 && token) alExpirar();
    throw new ApiError(respuesta.status, json.message || "Error inesperado", json.details || []);
  }
  return json.data as T;
}

export const api = {
  get: <T>(ruta: string) => pedir<T>("GET", ruta),
  post: <T>(ruta: string, cuerpo?: unknown) => pedir<T>("POST", ruta, cuerpo ?? {}),
  put: <T>(ruta: string, cuerpo?: unknown) => pedir<T>("PUT", ruta, cuerpo ?? {}),
  patch: <T>(ruta: string, cuerpo?: unknown) => pedir<T>("PATCH", ruta, cuerpo ?? {}),
};

// Texto legible de un error (incluye los campos inválidos)
export const mensajeDeError = (error: unknown) => {
  if (error instanceof ApiError) {
    const campos = error.details
      .map((d) => (d.field ? `${d.field}: ${d.message}` : d.message))
      .join(" · ");
    return campos ? `${error.message} (${campos})` : error.message;
  }
  return "Ocurrió un error inesperado";
};
