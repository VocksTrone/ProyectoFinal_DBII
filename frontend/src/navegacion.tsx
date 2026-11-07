import { createContext, ReactNode, useContext, useState } from "react";

export type Pagina =
  | "inicio"
  | "pacientes"
  | "registro"
  | "historial"
  | "atencion"
  | "agenda"
  | "internamientos"
  | "internamiento"
  | "ordenes"
  | "resultados"
  | "reporte";

type Ubicacion = { pagina: Pagina; id?: string; extra?: string };

const NavContext = createContext<{ actual: Ubicacion; ir: (pagina: Pagina, id?: string, extra?: string) => void }>({
  actual: { pagina: "inicio" },
  ir: () => undefined,
});

export function NavegacionProvider({ children }: { children: ReactNode }) {
  const [actual, setActual] = useState<Ubicacion>({ pagina: "inicio" });
  const ir = (pagina: Pagina, id?: string, extra?: string) => {
    setActual({ pagina, id, extra });
    window.scrollTo({ top: 0 });
  };
  return <NavContext.Provider value={{ actual, ir }}>{children}</NavContext.Provider>;
}

export const useNav = () => useContext(NavContext);
