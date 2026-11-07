import "./extra.css";
import { INSTITUCIONES } from "./instituciones";
import { NavegacionProvider, useNav } from "./navegacion";
import Historial from "./paginas/Historial";
import NuevaConsulta from "./paginas/hospital/NuevaConsulta";
import NuevaOrden from "./paginas/laboratorio/NuevaOrden";
import OrdenesDia from "./paginas/laboratorio/OrdenesDia";
import Reporte from "./paginas/laboratorio/Reporte";
import Resultados from "./paginas/laboratorio/Resultados";
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
  const usuario = useUsuario();
  const { actual } = useNav();
  const { pagina, id } = actual;
  const esLab = usuario.institucion === "laboratorio";
  switch (pagina) {
    case "pacientes": return <Pacientes />;
    case "registro": return <RegistroPaciente />;
    case "historial": return <Historial id={id!} key={id} />;
    // Misma acción, distinta pantalla según la institución
    case "atencion": return esLab ? <NuevaOrden idPaciente={id} key={id} /> : <NuevaConsulta idPaciente={id!} key={id} />;
    case "ordenes": return <OrdenesDia />;
    case "resultados": return <Resultados idOrden={id!} key={id} />;
    case "reporte": return <Reporte idOrden={id!} key={id} />;
    case "agenda": return <Pendiente titulo="Agenda" />;
    case "internamientos":
    case "internamiento": return <Pendiente titulo="Internamientos" />;
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
