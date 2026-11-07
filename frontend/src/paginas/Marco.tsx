import { ReactNode } from "react";
import { INSTITUCIONES, nombreRol } from "../instituciones";
import { Pagina, useNav } from "../navegacion";
import { useSesion, useUsuario } from "../sesion";
import { Icon, IconName, iniciales } from "../ui/componentes";

export function Logo() {
  return <div className="brand"><div className="brand-mark"><Icon name="activity" size={25} /></div><div><strong>Medis</strong><span>Historial clínico</span></div></div>;
}

// Páginas que pertenecen a cada opción del menú
const SECCION: Partial<Record<Pagina, Pagina>> = {
  registro: "pacientes",
  historial: "pacientes",
  atencion: "pacientes",
  internamiento: "internamientos",
  resultados: "ordenes",
  reporte: "ordenes",
};

function Sidebar() {
  const usuario = useUsuario();
  const { salir } = useSesion();
  const { actual, ir } = useNav();
  const activa = SECCION[actual.pagina] ?? actual.pagina;
  const items: { pagina: Pagina; etiqueta: string; icono: IconName }[] = [
    { pagina: "inicio", etiqueta: "Inicio", icono: "home" },
    { pagina: "pacientes", etiqueta: "Pacientes", icono: "users" },
    ...INSTITUCIONES[usuario.institucion].menu,
  ];
  return <aside className="sidebar">
    <Logo />
    <nav>
      <p className="nav-label">MENÚ PRINCIPAL</p>
      {items.map((item) => <button key={item.pagina} className={`nav-item ${activa === item.pagina ? "active" : ""}`} onClick={() => ir(item.pagina)}><Icon name={item.icono} /><span>{item.etiqueta}</span>{activa === item.pagina && <i />}</button>)}
    </nav>
    <div className="sidebar-help"><div className="help-icon"><Icon name="shield" /></div><strong>Conectado a {INSTITUCIONES[usuario.institucion].motor}</strong><span>Tus datos se guardan en el motor de tu institución.</span></div>
    <button className="nav-item logout" onClick={salir}><Icon name="logout" /><span>Cerrar sesión</span></button>
  </aside>;
}

function Topbar() {
  const usuario = useUsuario();
  const inst = INSTITUCIONES[usuario.institucion];
  return <header className="topbar">
    <div className="institution"><Icon name="shield" size={16} /><span>{inst.nombre}</span><i /> <small>{inst.motor}</small></div>
    <div className="top-actions">
      <div className="user-profile"><div className="avatar doctor">{iniciales(usuario.nombre)}</div><div><strong>{usuario.nombre}</strong><span>{nombreRol(usuario.rol, usuario.institucion)}</span></div></div>
    </div>
  </header>;
}

export default function Marco({ children }: { children: ReactNode }) {
  return <div className="app-shell"><Sidebar /><div className="app-main"><Topbar /><main className="content">{children}</main></div></div>;
}
