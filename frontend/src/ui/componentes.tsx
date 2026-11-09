import { createContext, FormEvent, ReactNode, useCallback, useContext, useEffect, useState } from "react";
import { mensajeDeError } from "../api/cliente";

export type IconName =
  | "home" | "users" | "calendar" | "logout" | "search" | "plus" | "clock" | "chevron" | "bell" | "file"
  | "heart" | "archive" | "arrow" | "check" | "shield" | "droplet" | "activity" | "more" | "filter"
  | "edit" | "close" | "lock" | "flask" | "alert";

const paths: Record<IconName, ReactNode> = {
  home: <><path d="m3 10 9-7 9 7" /><path d="M5 9v11h14V9" /><path d="M9 20v-7h6v7" /></>,
  users: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></>,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 11h18" /></>,
  logout: <><path d="M10 17l5-5-5-5M15 12H3" /><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" /></>,
  search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
  plus: <path d="M12 5v14M5 12h14" />,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  chevron: <path d="m9 18 6-6-6-6" />,
  bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path d="M10 21h4" /></>,
  file: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6M8 13h8M8 17h6" /></>,
  heart: <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8z" />,
  archive: <path d="M21 8v13H3V8M1 3h22v5H1zM10 12h4" />,
  arrow: <path d="M19 12H5M12 19l-7-7 7-7" />,
  check: <path d="m5 12 4 4L19 6" />,
  shield: <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="m9 12 2 2 4-4" /></>,
  droplet: <path d="M12 2.7S5 10.2 5 15a7 7 0 0 0 14 0c0-4.8-7-12.3-7-12.3z" />,
  activity: <path d="M3 12h4l2-7 4 14 2-7h6" />,
  more: <><circle cx="5" cy="12" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /></>,
  filter: <path d="M4 5h16M7 12h10M10 19h4" />,
  edit: <><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4z" /></>,
  close: <path d="M18 6 6 18M6 6l12 12" />,
  lock: <><rect x="4" y="10" width="16" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></>,
  flask: <><path d="M9 3h6M10 3v6L4.5 18.5A2 2 0 0 0 6.2 21h11.6a2 2 0 0 0 1.7-2.5L14 9V3" /><path d="M7 15h10" /></>,
  alert: <><path d="M12 9v4M12 17h.01" /><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" /></>,
};

export function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

export function Button({ children, variant = "primary", icon, onClick, type = "button", disabled }: {
  children: ReactNode;
  variant?: "primary" | "secondary" | "danger" | "ghost";
  icon?: IconName;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
}) {
  return <button type={type} disabled={disabled} className={`btn btn-${variant}`} onClick={onClick}>{icon && <Icon name={icon} size={17} />}<span>{children}</span></button>;
}

export function Field({ label, children, full = false, error }: { label: string; children: ReactNode; full?: boolean; error?: string }) {
  return <label className={`field ${full ? "field-full" : ""} ${error ? "field-error" : ""}`}><span>{label}</span>{children}{error && <small className="field-message">{error}</small>}</label>;
}

export function Search({ value, onChange, placeholder = "Buscar..." }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return <div className="search"><Icon name="search" size={18} /><input aria-label={placeholder} placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} /></div>;
}

export function PageTitle({ eyebrow, title, description, actions }: { eyebrow?: string; title: string; description?: string; actions?: ReactNode }) {
  return <div className="page-heading"><div>{eyebrow && <p>{eyebrow}</p>}<h1>{title}</h1>{description && <span>{description}</span>}</div>{actions && <div className="heading-actions">{actions}</div>}</div>;
}

export function Avatar({ nombre, className = "" }: { nombre: string; className?: string }) {
  return <div className={`avatar ${colorDe(nombre)} ${className}`}>{iniciales(nombre)}</div>;
}

// Fila que también se abre con Enter o Espacio
export const filaClic = (abrir: () => void) => ({
  onClick: abrir,
  tabIndex: 0,
  role: "link" as const,
  onKeyDown: (e: { key: string; preventDefault: () => void }) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      abrir();
    }
  },
});

export function Cargando({ texto = "Cargando..." }: { texto?: string }) {
  return <div className="loading-state"><span className="spinner" />{texto}</div>;
}

export function ErrorCaja({ error, reintentar }: { error: unknown; reintentar?: () => void }) {
  return <div className="error-box"><Icon name="alert" /><div><strong>No se pudo completar la operación</strong><span>{mensajeDeError(error)}</span></div>{reintentar && <Button variant="secondary" onClick={reintentar}>Reintentar</Button>}</div>;
}

export function Restricted({ texto = "Tu rol no tiene permisos para consultar información clínica restringida." }: { texto?: string }) {
  return <div className="restricted"><div><Icon name="lock" size={26} /></div><h2>Información restringida</h2><p>{texto}</p></div>;
}

export function EmptyState({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return <div className="empty-state"><div><Icon name="file" size={27} /></div><h2>{title}</h2><p>{description}</p>{action}</div>;
}

export function Modal({ titulo, descripcion, icono, peligro, cerrar, onSubmit, children, acciones }: {
  titulo: string;
  descripcion?: string;
  icono?: IconName;
  peligro?: boolean;
  cerrar: () => void;
  onSubmit: () => void | Promise<void>;
  children: ReactNode;
  acciones: ReactNode;
}) {
  const enviar = (e: FormEvent) => {
    e.preventDefault();
    onSubmit();
  };
  return <div className="modal-backdrop" onMouseDown={cerrar}><form className="modal" onMouseDown={(e) => e.stopPropagation()} onSubmit={enviar}>
    <div className="modal-head">{icono && <div className={`modal-title-icon ${peligro ? "danger" : "hospitalize"}`}><Icon name={icono} /></div>}<div><h2>{titulo}</h2>{descripcion && <p>{descripcion}</p>}</div><button type="button" onClick={cerrar}><Icon name="close" /></button></div>
    <div className="modal-body">{children}</div>
    <div className="modal-actions">{acciones}</div>
  </form></div>;
}

type Aviso = { tipo: "ok" | "error"; titulo: string; texto: string };
const AvisoContext = createContext<(aviso: Aviso) => void>(() => undefined);

export function AvisoProvider({ children }: { children: ReactNode }) {
  const [aviso, setAviso] = useState<Aviso | null>(null);
  useEffect(() => {
    if (!aviso) return;
    const t = window.setTimeout(() => setAviso(null), 4500);
    return () => window.clearTimeout(t);
  }, [aviso]);
  return <AvisoContext.Provider value={setAviso}>{children}{aviso && <div className={`save-toast ${aviso.tipo === "error" ? "toast-error" : ""}`} role="status"><span><Icon name={aviso.tipo === "ok" ? "check" : "alert"} /></span><div><strong>{aviso.titulo}</strong><small>{aviso.texto}</small></div><button onClick={() => setAviso(null)}><Icon name="close" size={15} /></button></div>}</AvisoContext.Provider>;
}

export function useAviso() {
  const mostrar = useContext(AvisoContext);
  return {
    ok: (texto: string, titulo = "Guardado correctamente") => mostrar({ tipo: "ok", titulo, texto }),
    error: (error: unknown) => mostrar({ tipo: "error", titulo: "No se pudo guardar", texto: mensajeDeError(error) }),
  };
}

export function useCarga<T>(cargar: () => Promise<T>, deps: unknown[]) {
  const [datos, setDatos] = useState<T | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [cargando, setCargando] = useState(true);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let vigente = true;
    setCargando(true);
    setError(null);
    cargar()
      .then((d) => vigente && setDatos(d))
      .catch((e) => vigente && setError(e))
      .finally(() => vigente && setCargando(false));
    return () => {
      vigente = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, version]);

  const recargar = useCallback(() => setVersion((v) => v + 1), []);
  return { datos, error, cargando, recargar };
}

const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

// "2026-11-05" o ISO -> "05 nov 2026"
export const fechaCorta = (valor?: string | null) => {
  if (!valor) return "—";
  const [a, m, d] = valor.slice(0, 10).split("-");
  return `${d} ${MESES[Number(m) - 1]} ${a}`;
};

export const horaDe = (iso?: string | null) => {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString("es-GT", { hour: "2-digit", minute: "2-digit" });
};

export const hoyISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export const edad = (fecha: string) => {
  const n = new Date(fecha + "T00:00:00");
  const h = new Date();
  let anios = h.getFullYear() - n.getFullYear();
  if (h.getMonth() < n.getMonth() || (h.getMonth() === n.getMonth() && h.getDate() < n.getDate())) anios--;
  return anios === 1 ? "1 año" : `${anios} años`;
};

export const formatoDpi = (dpi?: string | null) => (dpi ? `${dpi.slice(0, 4)} ${dpi.slice(4, 9)} ${dpi.slice(9)}` : "Sin DPI");
export const formatoTelefono = (t?: string | null) => (t ? `${t.slice(0, 4)}-${t.slice(4)}` : "—");
export const sexoTexto = (s: string) => (s === "F" ? "Femenino" : "Masculino");

export const iniciales = (nombre: string) =>
  nombre.replace(/^(Dr\.|Dra\.|Lic\.)\s/, "").split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]).join("").toUpperCase();

const COLORES = ["mint", "blue", "violet", "orange", "rose", "teal"];
export const colorDe = (texto: string) => COLORES[[...texto].reduce((s, c) => s + c.charCodeAt(0), 0) % COLORES.length];
