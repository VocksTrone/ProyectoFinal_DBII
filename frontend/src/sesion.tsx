import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { alExpirarSesion, api, fijarToken } from "./api/cliente";
import type { Usuario } from "./api/tipos";

type Sesion = {
  usuario: Usuario | null;
  entrar: (usuario: string, password: string) => Promise<void>;
  salir: () => void;
};

const SesionContext = createContext<Sesion>({ usuario: null, entrar: async () => undefined, salir: () => undefined });
const CLAVE = "medis.sesion";

// sessionStorage: la sesión se borra al cerrar la pestaña
const leerGuardada = (): { token: string; usuario: Usuario } | null => {
  try {
    return JSON.parse(sessionStorage.getItem(CLAVE) || "null");
  } catch {
    return null;
  }
};

export function SesionProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(() => {
    const guardada = leerGuardada();
    if (guardada) fijarToken(guardada.token);
    return guardada?.usuario ?? null;
  });

  const salir = () => {
    fijarToken(null);
    setUsuario(null);
    try {
      sessionStorage.removeItem(CLAVE);
    } catch {
      /* sin almacenamiento */
    }
  };

  useEffect(() => alExpirarSesion(salir), []);

  const entrar = async (nombreUsuario: string, password: string) => {
    const datos = await api.post<{ token: string; usuario: Usuario }>("/auth/login", { usuario: nombreUsuario, password });
    fijarToken(datos.token);
    setUsuario(datos.usuario);
    try {
      sessionStorage.setItem(CLAVE, JSON.stringify(datos));
    } catch {
      /* sin almacenamiento */
    }
  };

  return <SesionContext.Provider value={{ usuario, entrar, salir }}>{children}</SesionContext.Provider>;
}

export const useSesion = () => useContext(SesionContext);

export const useUsuario = () => {
  const { usuario } = useSesion();
  if (!usuario) throw new Error("Sin sesión");
  return usuario;
};
