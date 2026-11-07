import "./extra.css";
import { NavegacionProvider, useNav } from "./navegacion";
import Historial from "./paginas/Historial";
import Agenda from "./paginas/hospital/Agenda";
import InternamientoDetalle from "./paginas/hospital/InternamientoDetalle";
import Internamientos from "./paginas/hospital/Internamientos";
import NuevaConsulta from "./paginas/hospital/NuevaConsulta";
import Inicio from "./paginas/Inicio";
import NuevaOrden from "./paginas/laboratorio/NuevaOrden";
import OrdenesDia from "./paginas/laboratorio/OrdenesDia";
import Reporte from "./paginas/laboratorio/Reporte";
import Resultados from "./paginas/laboratorio/Resultados";
import Login from "./paginas/Login";
import Marco from "./paginas/Marco";
import Pacientes from "./paginas/Pacientes";
import RegistroPaciente from "./paginas/RegistroPaciente";
import { SesionProvider, useSesion, useUsuario } from "./sesion";
import { AvisoProvider } from "./ui/componentes";

function Paginas() {
  const usuario = useUsuario();
  const { actual } = useNav();
  const { pagina, id, extra } = actual;
  const esHospital = usuario.institucion === "hospital";
  const esLab = usuario.institucion === "laboratorio";

  switch (pagina) {
    // Comunes a todas las instituciones
    case "pacientes": return <Pacientes />;
    case "registro": return <RegistroPaciente />;
    case "historial": return <Historial id={id!} key={id} />;
    // Misma acción, distinta pantalla según la institución
    case "atencion": return esLab ? <NuevaOrden idPaciente={id} key={id} /> : <NuevaConsulta idPaciente={id!} idCitaInicial={extra} key={`${id}-${extra}`} />;
    // Propias del Hospital
    case "agenda": return esHospital ? <Agenda /> : <Inicio />;
    case "internamientos": return esHospital ? <Internamientos /> : <Inicio />;
    case "internamiento": return esHospital ? <InternamientoDetalle id={id!} key={id} /> : <Inicio />;
    // Propias del Laboratorio
    case "ordenes": return esLab ? <OrdenesDia /> : <Inicio />;
    case "resultados": return esLab ? <Resultados idOrden={id!} key={id} /> : <Inicio />;
    case "reporte": return esLab ? <Reporte idOrden={id!} key={id} /> : <Inicio />;
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
