import { ReactNode } from "react";
import { api, ApiError } from "../api/cliente";
import type { Atencion, Cita, Internamiento, Paciente, Tutor, VacunaCatalogo } from "../api/tipos";
import { INSTITUCIONES } from "../instituciones";
import { Pagina, useNav } from "../navegacion";
import { useUsuario } from "../sesion";
import { Avatar, Button, Cargando, EmptyState, ErrorCaja, Icon, IconName, PageTitle, hoyISO, horaDe, edad, useCarga } from "../ui/componentes";
import { ESTADO_ORDEN } from "./laboratorio/util";

type Orden = Atencion & { paciente: { id: string; nombre: string } | null };

// "23:00" -> { hora: "11:00", periodo: "PM" }
const hora12 = (hhmm: string) => {
  const h = Number(hhmm.slice(0, 2));
  return { hora: `${((h + 11) % 12) + 1}:${hhmm.slice(3, 5)}`, periodo: h < 12 ? "AM" : "PM" };
};

function Tarjeta({ icono, color, titulo, valor, nota }: { icono: IconName; color: string; titulo: string; valor: ReactNode; nota: string }) {
  return <div className="stat-card"><div className={`stat-icon ${color}`}><Icon name={icono} /></div><div><span>{titulo}</span><strong>{valor}</strong><p>{nota}</p></div></div>;
}

function Accesos({ items }: { items: { pagina: Pagina; icono: IconName; titulo: string; texto: string }[] }) {
  const { ir } = useNav();
  return <section className="card quick-card"><div className="card-header"><div><h2>Accesos rápidos</h2><span>Acciones frecuentes</span></div></div><div className="quick-grid">
    {items.map((a) => <button key={a.titulo} onClick={() => ir(a.pagina)}><span className="quick-icon"><Icon name={a.icono} /></span><b>{a.titulo}</b><small>{a.texto}</small></button>)}
  </div></section>;
}

export default function Inicio() {
  const usuario = useUsuario();
  const { ir } = useNav();
  const inst = INSTITUCIONES[usuario.institucion];
  const nombre = usuario.nombre.replace(/^(Dr\.|Dra\.|Lic\.)\s/, "").split(" ")[0];
  const hora = new Date().getHours();
  const saludo = hora < 12 ? "Buenos días" : hora < 19 ? "Buenas tardes" : "Buenas noches";
  const fecha = new Date().toLocaleDateString("es-GT", { weekday: "long", day: "numeric", month: "long" }).toUpperCase();

  return <div>
    <PageTitle eyebrow={fecha} title={`${saludo}, ${nombre}`} description={`Resumen de tu jornada en ${inst.nombre} · datos en ${inst.motor}.`} actions={<Button icon="plus" onClick={() => ir("registro")}>Nuevo paciente</Button>} />
    {usuario.institucion === "hospital" ? <PanelHospital /> : usuario.institucion === "laboratorio" ? <PanelLaboratorio /> : usuario.institucion === "pediatria" ? <PanelPediatria /> : <PanelGeneral />}
  </div>;
}

// ---------- Hospital ----------

function PanelHospital() {
  const usuario = useUsuario();
  const { ir } = useNav();
  const { datos, error, cargando, recargar } = useCarga(async () => {
    const [citas, internados, pacientes] = await Promise.all([
      api.get<Cita[]>(`/hospital/citas?fecha=${hoyISO()}`),
      api.get<Internamiento[]>("/hospital/internamientos"),
      api.get<Paciente[]>("/pacientes"),
    ]);
    return { citas, internados, pacientes };
  }, []);

  if (cargando) return <Cargando />;
  if (error || !datos) return <ErrorCaja error={error} reintentar={recargar} />;
  const { citas, internados, pacientes } = datos;
  const pendientes = citas.filter((c) => c.estado === "programada");
  const ahora = new Date().toTimeString().slice(0, 5);
  const proxima = pendientes.find((c) => c.hora >= ahora) ?? pendientes[0];

  return <>
    <div className="stats-grid">
      <Tarjeta icono="calendar" color="aqua" titulo="CITAS PARA HOY" valor={citas.length} nota={`${pendientes.length} aún pendientes`} />
      <Tarjeta icono="heart" color="blue" titulo="PACIENTES INTERNADOS" valor={internados.length} nota="Internamientos activos" />
      <Tarjeta icono="clock" color="amber" titulo="PRÓXIMA CITA" valor={proxima ? `${hora12(proxima.hora).hora} ${hora12(proxima.hora).periodo}` : "—"} nota={proxima ? proxima.paciente : "Sin citas pendientes"} />
    </div>
    <div className="dashboard-grid">
      <section className="card schedule-card"><div className="card-header"><div><h2>Citas de hoy</h2><span>{citas.length} citas programadas</span></div><button className="link-btn" onClick={() => ir("agenda")}>Ver agenda completa <Icon name="chevron" size={15} /></button></div>
        {citas.length === 0 ? <EmptyState title="No hay citas hoy" description="Puedes agendar una desde la Agenda." action={<Button variant="secondary" icon="calendar" onClick={() => ir("agenda")}>Ir a la agenda</Button>} /> :
          <div className="appointment-list">{citas.map((c) => <button className="appointment" key={c.id} onClick={() => (usuario.rol === "medico" && c.estado === "programada" ? ir("atencion", c.id_paciente, c.id) : ir("historial", c.id_paciente))}>
            <div className="appointment-time"><strong>{hora12(c.hora).hora}</strong><span>{hora12(c.hora).periodo}</span></div>
            <Avatar nombre={c.paciente} />
            <div className="appointment-info"><strong>{c.paciente}</strong><span>{c.medico} · {c.especialidad}</span></div>
            <span className={`status cita-estado-${c.estado}`}>{c.estado === "programada" ? "Programada" : c.estado === "atendida" ? "Atendida" : "Cancelada"}</span>
            <Icon name="chevron" size={16} />
          </button>)}</div>}
      </section>
      <aside className="right-column">
        <Accesos items={[
          { pagina: "registro", icono: "plus", titulo: "Nuevo paciente", texto: "Registrar expediente" },
          { pagina: "agenda", icono: "calendar", titulo: "Agendar cita", texto: "Nueva cita médica" },
          { pagina: "pacientes", icono: "search", titulo: "Buscar historial", texto: `${pacientes.length} expedientes` },
          { pagina: "internamientos", icono: "heart", titulo: "Internamientos", texto: `${internados.length} activos` },
        ]} />
        <section className="card recent-card"><div className="card-header"><div><h2>Pacientes internados</h2></div></div>
          {internados.length === 0 ? <p className="hint card-pad">No hay pacientes internados.</p> : internados.slice(0, 4).map((i) => <button className="activity-item as-button" key={i.id} onClick={() => ir("internamiento", i.id)}><span><Icon name="heart" size={16} /></span><p><b>{i.paciente}</b><small>{i.motivo} · {i.medico}</small></p></button>)}
        </section>
      </aside>
    </div>
  </>;
}

// ---------- Laboratorio ----------

function PanelLaboratorio() {
  const usuario = useUsuario();
  const { ir } = useNav();
  const { datos: ordenes, error, cargando, recargar } = useCarga(() => api.get<Orden[]>("/laboratorio/ordenes"), []);

  if (cargando) return <Cargando />;
  if (error || !ordenes) return <ErrorCaja error={error} reintentar={recargar} />;
  const examenes = ordenes.flatMap((o) => o.extra.examenes as { estado: string }[]);
  const porValidar = examenes.filter((e) => e.estado === "pendiente").length;

  return <>
    <div className="stats-grid lab-stats">
      <Tarjeta icono="file" color="aqua" titulo="ÓRDENES POR ATENDER" valor={ordenes.length} nota="Pendientes y en proceso" />
      <Tarjeta icono="clock" color="amber" titulo="EN PROCESO" valor={ordenes.filter((o) => o.extra.estado === "en_proceso").length} nota="Con resultados parciales" />
      <Tarjeta icono="flask" color="blue" titulo="EXÁMENES POR VALIDAR" valor={porValidar} nota={usuario.rol === "medico" ? "Requieren tu validación" : "En manos del laboratorista"} />
    </div>
    <div className="dashboard-grid">
      <section className="card schedule-card"><div className="card-header"><div><h2>Lista de trabajo</h2><span>Órdenes más antiguas primero</span></div><button className="link-btn" onClick={() => ir("ordenes")}>Ver todas <Icon name="chevron" size={15} /></button></div>
        {ordenes.length === 0 ? <EmptyState title="Todo al día" description="No hay órdenes pendientes." action={<Button icon="plus" onClick={() => ir("atencion")}>Nueva orden</Button>} /> :
          <div className="appointment-list">{ordenes.slice(0, 6).map((o) => <button className="appointment" key={o.id} onClick={() => (usuario.rol === "medico" ? ir("resultados", o.id) : o.paciente && ir("historial", o.paciente.id))}>
            <div className="appointment-time"><strong>{horaDe(o.fecha)}</strong><span>{o.extra.codigo}</span></div>
            <Avatar nombre={o.paciente?.nombre || "?"} />
            <div className="appointment-info"><strong>{o.paciente?.nombre}</strong><span>{(o.extra.examenes as { tipo_examen: string }[]).map((e) => e.tipo_examen).join(" · ")}</span></div>
            <span className={`lab-status ${ESTADO_ORDEN[o.extra.estado].clase}`}><i />{ESTADO_ORDEN[o.extra.estado].texto}</span>
            <Icon name="chevron" size={16} />
          </button>)}</div>}
      </section>
      <aside className="right-column"><Accesos items={[
        { pagina: "atencion", icono: "plus", titulo: "Nueva orden", texto: "Recepción de muestras" },
        { pagina: "ordenes", icono: "flask", titulo: "Órdenes del día", texto: "Lista de trabajo" },
        { pagina: "registro", icono: "users", titulo: "Nuevo paciente", texto: "Registrar paciente" },
        { pagina: "pacientes", icono: "search", titulo: "Buscar paciente", texto: "Historial de órdenes" },
      ]} /></aside>
    </div>
  </>;
}

// ---------- Centro Médico Pediátrico ----------

function PanelPediatria() {
  const usuario = useUsuario();
  const { ir } = useNav();
  const { datos, error, cargando, recargar } = useCarga(async () => {
    const [pacientes, tutores, vacunas] = await Promise.all([
      api.get<Paciente[]>("/pacientes"),
      api.get<Tutor[]>("/pediatria/tutores"),
      api.get<VacunaCatalogo[]>("/pediatria/vacunas"),
    ]);
    return { pacientes, tutores, vacunas };
  }, []);

  if (cargando) return <Cargando texto="Cargando panel pediátrico..." />;
  if (error || !datos) return <ErrorCaja error={error} reintentar={recargar} />;
  const { pacientes, tutores, vacunas } = datos;
  const activos = pacientes.filter((p) => p.estado === "activo");

  return <>
    <div className="stats-grid">
      <Tarjeta icono="users" color="aqua" titulo="PACIENTES PEDIÁTRICOS" valor={pacientes.length} nota={`${activos.length} activos en control`} />
      <Tarjeta icono="heart" color="blue" titulo="TUTORES REGISTRADOS" valor={tutores.length} nota="Padres y responsables legales" />
      <Tarjeta icono="shield" color="amber" titulo="ESQUEMA DE VACUNAS" valor={vacunas.length} nota="Biológicos oficiales en MySQL" />
    </div>
    <div className="dashboard-grid">
      <section className="card schedule-card">
        <div className="card-header">
          <div>
            <h2>Pacientes pediátricos</h2>
            <span>{activos.length} infantes registrados en el sistema</span>
          </div>
          <button className="link-btn" onClick={() => ir("pacientes")}>Ver todos <Icon name="chevron" size={15} /></button>
        </div>
        {pacientes.length === 0 ? (
          <EmptyState title="No hay pacientes pediátricos" description="Registra el primer infante." action={<Button icon="plus" onClick={() => ir("registro")}>Nuevo paciente</Button>} />
        ) : (
          <div className="appointment-list">
            {pacientes.slice(0, 5).map((p) => (
              <button className="appointment" key={p.id} onClick={() => ir("historial", p.id)}>
                <Avatar nombre={`${p.nombres} ${p.apellidos}`} />
                <div className="appointment-info">
                  <strong>{p.nombres} {p.apellidos}</strong>
                  <span>{edad(p.fecha_nacimiento)} · {p.extra?.encargado ? `Tutor: ${p.extra.encargado.nombres} (${p.extra.encargado.parentesco})` : `Expediente PED-${p.id.padStart(4, "0")}`}</span>
                </div>
                <span className={`status ${p.estado === "archivado" ? "archivado" : ""}`}>{p.estado === "activo" ? "Activo" : "Archivado"}</span>
                <Icon name="chevron" size={16} />
              </button>
            ))}
          </div>
        )}
      </section>
      <aside className="right-column">
        <Accesos items={[
          { pagina: "registro", icono: "plus", titulo: "Nuevo paciente", texto: "Registrar infante" },
          { pagina: "tutores", icono: "users", titulo: "Tutores legales", texto: `${tutores.length} registrados` },
          { pagina: "vacunacion", icono: "shield", titulo: "Esquema de vacunas", texto: `${vacunas.length} biológicos` },
          { pagina: "pacientes", icono: "search", titulo: "Directorio", texto: `${pacientes.length} expedientes` },
        ]} />
      </aside>
    </div>
  </>;
}

// ---------- Instituciones sin panel propio (adaptador en construcción) ----------

function PanelGeneral() {
  const usuario = useUsuario();
  const { datos, error, cargando } = useCarga(() => api.get<Paciente[]>("/pacientes"), []);
  if (cargando) return <Cargando />;
  if (error instanceof ApiError && error.status === 503) return <section className="card"><EmptyState title={`${INSTITUCIONES[usuario.institucion].nombre} aún no está disponible`} description={`El adaptador de ${INSTITUCIONES[usuario.institucion].motor} todavía no está implementado en el backend.`} /></section>;
  if (error) return <ErrorCaja error={error} />;
  return <>
    <div className="stats-grid"><Tarjeta icono="users" color="aqua" titulo="PACIENTES" valor={datos?.length ?? 0} nota="Expedientes registrados" /></div>
    <Accesos items={[
      { pagina: "registro", icono: "plus", titulo: "Nuevo paciente", texto: "Registrar expediente" },
      { pagina: "pacientes", icono: "search", titulo: "Buscar historial", texto: "Consultar expediente" },
    ]} />
  </>;
}
