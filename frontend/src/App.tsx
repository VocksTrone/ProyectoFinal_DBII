import "./extra.css";
import { INSTITUCIONES } from "./instituciones";
import { NavegacionProvider, useNav } from "./navegacion";
import Historial from "./paginas/Historial";
import Login from "./paginas/Login";
import Marco from "./paginas/Marco";
import Pacientes from "./paginas/Pacientes";
import RegistroPaciente from "./paginas/RegistroPaciente";
import { SesionProvider, useSesion, useUsuario } from "./sesion";
import { AvisoProvider, Button, EmptyState, Icon, PageTitle } from "./ui/componentes";

function Inicio() {
  const usuario = useUsuario();
  const { ir } = useNav();
  const inst = INSTITUCIONES[usuario.institucion];
  const nombre = usuario.nombre.replace(/^(Dr\.|Dra\.|Lic\.)\s/, "").split(" ")[0];
  return <div>
    <PageTitle eyebrow={new Date().toLocaleDateString("es-GT", { weekday: "long", day: "numeric", month: "long" }).toUpperCase()} title={`Hola, ${nombre}`} description={`Bienvenido a ${inst.nombre}.`} actions={<Button icon="plus" onClick={() => ir("registro")}>Nuevo paciente</Button>} />
    <section className="card quick-card"><div className="card-header"><div><h2>Accesos rápidos</h2><span>Acciones frecuentes</span></div></div><div className="quick-grid">
      <button onClick={() => ir("registro")}><span className="quick-icon"><Icon name="plus" /></span><b>Nuevo paciente</b><small>Registrar expediente</small></button>
      <button onClick={() => ir("pacientes")}><span className="quick-icon"><Icon name="search" /></span><b>Buscar historial</b><small>Consultar expediente</small></button>
    </div></section>
  </div>;
}

function Pendiente({ titulo }: { titulo: string }) {
  const { ir } = useNav();
  return <section className="card"><EmptyState title={titulo} description="Esta pantalla se conecta en el siguiente bloque." action={<Button variant="secondary" onClick={() => ir("inicio")}>Volver al inicio</Button>} /></section>;
}

function Paginas() {
  const { actual } = useNav();
  const { pagina, id } = actual;
  switch (pagina) {
    case "pacientes": return <Pacientes />;
    case "registro": return <RegistroPaciente />;
    case "historial": return <Historial id={id!} key={id} />;
    case "atencion": return <Pendiente titulo="Nueva atención" />;
    case "agenda": return <Pendiente titulo="Agenda" />;
    case "internamientos":
    case "internamiento": return <Pendiente titulo="Internamientos" />;
    case "ordenes":
    case "resultados":
    case "reporte": return <Pendiente titulo="Laboratorio" />;
    default: return <Inicio />;
  }
}

function Aplicacion() {
  const { usuario } = useSesion();
  if (!usuario) return <Login />;
  // key: al cambiar de usuario se reinicia la navegación
  return <NavegacionProvider key={usuario.id + usuario.institucion}><Marco><Paginas /></Marco></NavegacionProvider>;
}

export default function App() {
  return <AvisoProvider><SesionProvider><Aplicacion /></SesionProvider></AvisoProvider>;
}
