import { createContext, FormEvent, ReactNode, useContext, useState } from "react";

type Page =
  | "inicio"
  | "pacientes"
  | "agenda"
  | "internamientos"
  | "registro"
  | "historial"
  | "consulta";

type InstitutionKey = "hospital" | "pediatria" | "clinica" | "lab";
type AccessRole = "Médico" | "Secretaria";
type Session = {
  username: string;
  institution: InstitutionKey;
  role: AccessRole;
  displayRole: string;
  name: string;
  initials: string;
};

const institutions: Record<InstitutionKey, { name: string; database: string; tabs: string[] }> = {
  hospital: { name: "Hospital General", database: "PostgreSQL", tabs: ["Resumen", "Consultas", "Diagnósticos y tratamientos", "Recetas", "Antecedentes", "Internamientos", "Facturas"] },
  pediatria: { name: "Centro Médico Pediátrico", database: "MySQL", tabs: ["Resumen", "Consultas", "Diagnósticos y Tratamientos", "Recetas", "Antecedentes", "Control de crecimiento", "Vacunas"] },
  clinica: { name: "Clínica Odontológica", database: "Firebase", tabs: ["Resumen", "Historial odontológico", "Odontograma", "Citas", "Pagos"] },
  lab: { name: "Laboratorio Clínico", database: "MongoDB", tabs: ["Resumen", "Órdenes y resultados", "Pagos"] },
};

const demoUsers: Session[] = [
  { username: "medico.hospital", institution: "hospital", role: "Médico", displayRole: "Médico", name: "Dr. Roberto Díaz", initials: "DR" },
  { username: "secretaria.hospital", institution: "hospital", role: "Secretaria", displayRole: "Secretaria", name: "Laura Méndez", initials: "LM" },
  { username: "medico.pediatria", institution: "pediatria", role: "Médico", displayRole: "Médico pediatra", name: "Dra. Andrea Soto", initials: "AS" },
  { username: "secretaria.pediatria", institution: "pediatria", role: "Secretaria", displayRole: "Secretaria", name: "Gabriela Choc", initials: "GC" },
  { username: "odontologo.clinica", institution: "clinica", role: "Médico", displayRole: "Odontólogo", name: "Dr. Luis Herrera", initials: "LH" },
  { username: "secretaria.clinica", institution: "clinica", role: "Secretaria", displayRole: "Secretaria", name: "Mónica Pérez", initials: "MP" },
  { username: "laboratorista.lab", institution: "lab", role: "Médico", displayRole: "Laboratorista", name: "Lic. Ana Castillo", initials: "AC" },
  { username: "secretaria.lab", institution: "lab", role: "Secretaria", displayRole: "Secretaria", name: "Paola Ramírez", initials: "PR" },
];

const ConfirmationContext = createContext<(message: string) => void>(() => undefined);

function ConfirmationProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState("");
  const notify = (nextMessage: string) => {
    setMessage(nextMessage);
    window.setTimeout(() => setMessage(""), 3200);
  };
  return <ConfirmationContext.Provider value={notify}>{children}{message && <div className="save-toast" role="status"><span><Icon name="check" /></span><div><strong>Guardado correctamente</strong><small>{message}</small></div><button onClick={() => setMessage("")}><Icon name="close" size={15} /></button></div>}</ConfirmationContext.Provider>;
}

function useConfirmation() {
  return useContext(ConfirmationContext);
}

type IconName =
  | "home"
  | "users"
  | "calendar"
  | "logout"
  | "search"
  | "plus"
  | "clock"
  | "chevron"
  | "bell"
  | "file"
  | "heart"
  | "archive"
  | "arrow"
  | "check"
  | "shield"
  | "droplet"
  | "activity"
  | "more"
  | "filter"
  | "edit"
  | "close"
  | "lock";

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
  archive: <><path d="M21 8v13H3V8M1 3h22v5H1zM10 12h4" /></>,
  arrow: <><path d="M19 12H5M12 19l-7-7 7-7" /></>,
  check: <path d="m5 12 4 4L19 6" />,
  shield: <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="m9 12 2 2 4-4" /></>,
  droplet: <path d="M12 2.7S5 10.2 5 15a7 7 0 0 0 14 0c0-4.8-7-12.3-7-12.3z" />,
  activity: <path d="M3 12h4l2-7 4 14 2-7h6" />,
  more: <><circle cx="5" cy="12" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /></>,
  filter: <path d="M4 5h16M7 12h10M10 19h4" />,
  edit: <><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4z" /></>,
  close: <path d="M18 6 6 18M6 6l12 12" />,
  lock: <><rect x="4" y="10" width="16" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></>,
};

function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

function Button({
  children,
  variant = "primary",
  icon,
  onClick,
  type = "button",
  disabled,
}: {
  children: ReactNode;
  variant?: "primary" | "secondary" | "danger" | "ghost";
  icon?: IconName;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
}) {
  return <button type={type} disabled={disabled} className={`btn btn-${variant}`} onClick={onClick}>{icon && <Icon name={icon} size={17} />}<span>{children}</span></button>;
}

function Field({ label, placeholder, type = "text", children, full = false }: { label: string; placeholder?: string; type?: string; children?: ReactNode; full?: boolean }) {
  return <label className={`field ${full ? "field-full" : ""}`}><span>{label}</span>{children || <input type={type} placeholder={placeholder} />}</label>;
}

function Search({ placeholder = "Buscar..." }: { placeholder?: string }) {
  return <div className="search"><Icon name="search" size={18} /><input aria-label={placeholder} placeholder={placeholder} /></div>;
}

const appointments = [
  { time: "08:30", name: "María Fernanda López", reason: "Control de hipertensión", status: "Confirmada", initials: "ML", color: "mint" },
  { time: "09:15", name: "Carlos Estuardo Méndez", reason: "Dolor abdominal", status: "En espera", initials: "CM", color: "blue" },
  { time: "10:00", name: "Ana Lucía Caal", reason: "Seguimiento de laboratorio", status: "Confirmada", initials: "AC", color: "violet" },
  { time: "11:30", name: "José Armando Xicay", reason: "Consulta general", status: "Pendiente", initials: "JX", color: "orange" },
  { time: "14:00", name: "Sofía Isabel Morales", reason: "Control de diabetes", status: "Confirmada", initials: "SM", color: "rose" },
];

const patients = [
  { name: "María Fernanda López García", dpi: "2456 78213 0101", age: "42 años", phone: "5554-8132", status: "Activo", initials: "ML", color: "mint" },
  { name: "Carlos Estuardo Méndez Soto", dpi: "1892 43065 0101", age: "35 años", phone: "4128-7804", status: "Activo", initials: "CM", color: "blue" },
  { name: "Ana Lucía Caal Choc", dpi: "2731 59104 1601", age: "28 años", phone: "5019-2467", status: "Activo", initials: "AC", color: "violet" },
  { name: "José Armando Xicay Pérez", dpi: "1640 92738 0401", age: "61 años", phone: "3782-9451", status: "Archivado", initials: "JX", color: "orange" },
  { name: "Sofía Isabel Morales Ruiz", dpi: "3058 12649 0101", age: "54 años", phone: "5960-1182", status: "Activo", initials: "SM", color: "rose" },
  { name: "Ricardo Antonio Castillo", dpi: "2195 67301 0901", age: "47 años", phone: "4206-8539", status: "Activo", initials: "RC", color: "teal" },
];

function Logo() {
  return <div className="brand"><div className="brand-mark"><Icon name="activity" size={25} /></div><div><strong>Medis</strong><span>Historial clínico</span></div></div>;
}

function Sidebar({ page, setPage, logout, session }: { page: Page; setPage: (p: Page) => void; logout: () => void; session: Session }) {
  const items: { id: Page; label: string; icon: IconName }[] = [
    { id: "inicio", label: "Inicio", icon: "home" },
    { id: "pacientes", label: "Pacientes", icon: "users" },
    { id: "agenda", label: "Agenda", icon: "calendar" },
    ...(session.institution === "hospital" ? [{ id: "internamientos" as Page, label: "Internamientos", icon: "heart" as IconName }] : []),
  ];
  return <aside className="sidebar">
    <Logo />
    <nav>
      <p className="nav-label">MENÚ PRINCIPAL</p>
      {items.map(item => <button key={item.id} className={`nav-item ${page === item.id ? "active" : ""}`} onClick={() => setPage(item.id)}><Icon name={item.icon} /><span>{item.label}</span>{page === item.id && <i />}</button>)}
    </nav>
    <div className="sidebar-help"><div className="help-icon"><Icon name="heart" /></div><strong>¿Necesitas ayuda?</strong><span>Contacta a soporte técnico</span><button>Centro de ayuda</button></div>
    <button className="nav-item logout" onClick={logout}><Icon name="logout" /><span>Cerrar sesión</span></button>
  </aside>;
}

function Topbar({ session }: { session: Session }) {
  const institution = institutions[session.institution];
  return <header className="topbar">
    <div className="institution"><Icon name="shield" size={16} /><span>{institution.name}</span><i /> <small>{institution.database}</small></div>
    <div className="top-actions">
      <button className="icon-btn" aria-label="Notificaciones"><Icon name="bell" /><b /></button>
      <div className="divider" />
      <button className="user-profile">
        <div className="avatar doctor">{session.initials}</div><div><strong>{session.name}</strong><span>{session.displayRole}</span></div><Icon name="chevron" size={15} />
      </button>
    </div>
  </header>;
}

function PageTitle({ eyebrow, title, description, actions }: { eyebrow?: string; title: string; description?: string; actions?: ReactNode }) {
  return <div className="page-heading"><div>{eyebrow && <p>{eyebrow}</p>}<h1>{title}</h1>{description && <span>{description}</span>}</div>{actions && <div className="heading-actions">{actions}</div>}</div>;
}

type DentalAppointmentStatus = "Programada" | "Confirmada" | "Atendida" | "Cancelada";
const dentalAppointments = [
  { time: "08:00", patient: "María José Fuentes", dentist: "Dr. Luis Herrera", reason: "Limpieza dental", status: "Confirmada" as DentalAppointmentStatus, initials: "MF", color: "mint" },
  { time: "08:45", patient: "Jorge Mario Cifuentes", dentist: "Dra. Elena Castillo", reason: "Dolor en molar", status: "Programada" as DentalAppointmentStatus, initials: "JC", color: "blue" },
  { time: "09:30", patient: "Alejandra Paola Díaz", dentist: "Dr. Luis Herrera", reason: "Control de ortodoncia", status: "Atendida" as DentalAppointmentStatus, initials: "AD", color: "violet" },
  { time: "10:15", patient: "Edgar René Morales", dentist: "Dra. Elena Castillo", reason: "Evaluación de caries", status: "Confirmada" as DentalAppointmentStatus, initials: "EM", color: "orange" },
  { time: "11:00", patient: "Lucía Fernanda Ajpacajá", dentist: "Dr. Luis Herrera", reason: "Extracción dental", status: "Cancelada" as DentalAppointmentStatus, initials: "LA", color: "rose" },
  { time: "12:30", patient: "Carlos Eduardo Lemus", dentist: "Dra. Elena Castillo", reason: "Blanqueamiento", status: "Programada" as DentalAppointmentStatus, initials: "CL", color: "teal" },
  { time: "14:00", patient: "Sofía Hernández López", dentist: "Dr. Luis Herrera", reason: "Primera evaluación", status: "Programada" as DentalAppointmentStatus, initials: "SH", color: "blue" },
];

function DentalAppointmentModal({ close }: { close: () => void }) {
  const [quickPatient, setQuickPatient] = useState(false);
  const notify = useConfirmation();
  return <div className="modal-backdrop" onMouseDown={close}><form className="modal dental-appointment-modal" onMouseDown={event => event.stopPropagation()} onSubmit={event => { event.preventDefault(); notify("La cita odontológica fue agendada."); close(); }}><div className="modal-head"><div><h2>Agendar cita</h2><p>Programa una atención en la Clínica Odontológica.</p></div><button type="button" onClick={close}><Icon name="close" /></button></div><div className="modal-body">
    <div className="patient-picker"><Field label="Paciente *" full><div className="search"><Icon name="search" size={18} /><input placeholder="Buscar por nombre, DPI o teléfono..." /></div></Field><button type="button" onClick={() => setQuickPatient(!quickPatient)}><Icon name="plus" /> {quickPatient ? "Ocultar registro rápido" : "Crear paciente rápido"}</button></div>
    {quickPatient && <div className="quick-patient-form"><strong>Nuevo paciente</strong><div className="form-grid"><Field label="DPI *" placeholder="0000 00000 0000" /><Field label="Nombre completo *" placeholder="Nombre y apellidos" /><Field label="Teléfono *" placeholder="0000-0000" /><Field label="Correo" type="email" placeholder="correo@ejemplo.com" /></div></div>}
    <Field label="Odontólogo *" full><select defaultValue="Dr. Luis Herrera"><option>Dr. Luis Herrera</option><option>Dra. Elena Castillo</option><option>Dr. Fernando Cabrera</option></select></Field>
    <div className="form-grid"><Field label="Fecha *"><input type="date" defaultValue="2024-06-17" /></Field><Field label="Hora *"><input type="time" defaultValue="09:30" /></Field></div>
    <Field label="Motivo *" full placeholder="Ej. Limpieza, dolor dental, control..." /><Field label="Notas de secretaría" full><textarea rows={3} placeholder="Indicaciones administrativas o información relevante..." /></Field>
  </div><div className="modal-actions"><Button variant="secondary" onClick={close}>Cancelar</Button><Button type="submit" icon="calendar">Agendar cita</Button></div></form></div>;
}

function ClinicReceptionDashboard({ setPage, session }: { setPage: (p: Page) => void; session: Session }) {
  const [items, setItems] = useState(dentalAppointments);
  const [modal, setModal] = useState(false);
  const statuses: DentalAppointmentStatus[] = ["Programada", "Confirmada", "Atendida", "Cancelada"];
  const cycleStatus = (index: number) => setItems(current => current.map((item, itemIndex) => itemIndex === index ? { ...item, status: statuses[(statuses.indexOf(item.status) + 1) % statuses.length] } : item));
  return <div>
    <PageTitle eyebrow="LUNES, 17 DE JUNIO" title={`Buenos días, ${session.name.split(" ")[0]}`} description="Recepción · Clínica Odontológica" actions={<Button icon="calendar" onClick={() => setModal(true)}>Agendar cita</Button>} />
    <div className="dental-reception-stats"><div><span>CITAS DE HOY</span><strong>14</strong></div><div><span>CONFIRMADAS</span><strong>8</strong></div><div><span>POR ATENDER</span><strong>6</strong></div><div><span>CANCELADAS</span><strong>1</strong></div></div>
    <section className="card reception-schedule"><div className="card-header"><div><h2>Agenda de hoy</h2><span>Haz clic en el estado para actualizarlo rápidamente</span></div><div className="schedule-date"><Icon name="calendar" /><span>17 junio 2024</span></div></div><div className="reception-head"><span>HORA</span><span>PACIENTE</span><span>ODONTÓLOGO</span><span>MOTIVO</span><span>ESTADO</span></div>
      <div>{items.map((appointment, index) => <div className="reception-row" key={`${appointment.time}-${appointment.patient}`}><strong className="reception-time">{appointment.time}</strong><button className="reception-patient" onClick={() => setPage("historial")}><div className={`avatar ${appointment.color}`}>{appointment.initials}</div><span>{appointment.patient}<small>Ver expediente</small></span></button><span className="reception-dentist">{appointment.dentist}</span><span className="reception-reason">{appointment.reason}</span><button className={`dental-status ${appointment.status.toLowerCase()}`} onClick={() => cycleStatus(index)}><i />{appointment.status}<Icon name="chevron" size={13} /></button></div>)}</div>
    </section>
    <button className="floating-schedule" onClick={() => setModal(true)}><Icon name="plus" /> Agendar cita</button>
    {modal && <DentalAppointmentModal close={() => setModal(false)} />}
  </div>;
}

const labOrders = [
  { code: "LAB-240617-018", time: "07:15", patient: "Andrea Lucía Pérez", tests: "Hematología completa · Glucosa", status: "Validada", initials: "AP", color: "mint" },
  { code: "LAB-240617-019", time: "07:40", patient: "Jorge Estuardo Gramajo", tests: "Perfil lipídico", status: "En proceso", initials: "JG", color: "blue" },
  { code: "LAB-240617-020", time: "08:05", patient: "María Fernanda Caal", tests: "Examen general de orina", status: "Recibida", initials: "MC", color: "violet" },
  { code: "LAB-240617-021", time: "08:30", patient: "Carlos Humberto López", tests: "Cultivo · Antibiograma", status: "En proceso", initials: "CL", color: "orange" },
  { code: "LAB-240617-022", time: "09:10", patient: "Sofía Alejandra Morales", tests: "Hematología completa · Perfil lipídico", status: "Recibida", initials: "SM", color: "rose" },
  { code: "LAB-240617-023", time: "09:45", patient: "Edwin Rafael Choc", tests: "Glucosa", status: "Validada", initials: "EC", color: "teal" },
];

function LabDashboard({ setPage, session }: { setPage: (page: Page) => void; session: Session }) {
  return <div><PageTitle eyebrow="LUNES, 17 DE JUNIO" title={`Buenos días, ${session.name.replace("Lic. ", "").split(" ")[0]}`} description="Resumen operativo del Laboratorio Clínico." actions={<Button icon="plus" onClick={() => setPage("consulta")}>Nueva orden de examen</Button>} />
    <div className="stats-grid lab-stats"><div className="stat-card"><div className="stat-icon aqua"><Icon name="file" /></div><div><span>ÓRDENES DEL DÍA</span><strong>24</strong><p>6 recibidas esta mañana</p></div></div><div className="stat-card"><div className="stat-icon amber"><Icon name="clock" /></div><div><span>ÓRDENES PENDIENTES</span><strong>8</strong><p><b>4 en proceso</b></p></div></div><div className="stat-card"><div className="stat-icon blue"><Icon name="check" /></div><div><span>RESULTADOS POR VALIDAR</span><strong>5</strong><p>Requieren revisión</p></div></div></div>
    <section className="card lab-day-orders"><div className="card-header"><div><h2>Órdenes del día</h2><span>Recepción y procesamiento de muestras</span></div><div className="lab-status-legend"><span><i className="received" />Recibida</span><span><i className="processing" />En proceso</span><span><i className="validated" />Validada</span></div></div><div className="lab-order-head"><span>HORA</span><span>ORDEN / PACIENTE</span><span>EXÁMENES</span><span>ESTADO</span><span /></div>{labOrders.map(order => <button className="lab-order-row" onClick={() => setPage("historial")} key={order.code}><strong>{order.time}</strong><div className={`avatar ${order.color}`}>{order.initials}</div><div className="lab-patient"><strong>{order.patient}</strong><span>{order.code}</span></div><span className="lab-tests">{order.tests}</span><span className={`lab-status ${order.status.toLowerCase().replace(" ", "-")}`}><i />{order.status}</span><Icon name="chevron" size={15} /></button>)}</section>
  </div>;
}

function Dashboard({ setPage, session }: { setPage: (p: Page) => void; session: Session }) {
  const institution = institutions[session.institution];
  const greetingName = session.name.replace(/^(Dr\.|Dra\.|Lic\.)\s/, "").split(" ")[0];
  const isPediatric = session.institution === "pediatria";
  if (session.institution === "clinica" && session.role === "Secretaria") return <ClinicReceptionDashboard setPage={setPage} session={session} />;
  if (session.institution === "lab") return <LabDashboard setPage={setPage} session={session} />;
  return <div>
    <PageTitle eyebrow="LUNES, 17 DE JUNIO" title={`Buenos días, ${greetingName}`} description={`Aquí tienes el resumen de tu jornada en ${institution.name}.`} actions={<Button icon="plus" onClick={() => setPage("registro")}>Nuevo paciente</Button>} />
    <div className="stats-grid">
      <div className="stat-card"><div className="stat-icon aqua"><Icon name="calendar" /></div><div><span>CITAS PARA HOY</span><strong>12</strong><p><b>3</b> aún pendientes</p></div><div className="mini-bars">{[24, 35, 30, 45, 52, 48, 65, 58, 72, 66, 82, 90].map((h, i) => <i key={i} style={{ height: `${h}%` }} />)}</div></div>
      <div className="stat-card"><div className="stat-icon blue"><Icon name="users" /></div><div><span>PACIENTES ACTIVOS</span><strong>1,284</strong><p className="positive">+18 este mes</p></div><div className="people-stack"><div className="avatar mint">ML</div><div className="avatar blue">CM</div><div className="avatar violet">AC</div><div className="avatar more-avatar">+15</div></div></div>
      <div className="stat-card"><div className="stat-icon amber"><Icon name="clock" /></div><div><span>PRÓXIMA CITA</span><strong className="time-stat">08:30</strong><p>en 25 minutos</p></div><div className="next-patient"><div className="avatar mint">ML</div><span>María López</span></div></div>
      {isPediatric && <div className="stat-card vaccine-stat"><div className="stat-icon orange"><Icon name="shield" /></div><div><span>VACUNAS PENDIENTES</span><strong>8</strong><p><b>Esta semana</b></p></div><button onClick={() => setPage("pacientes")}><Icon name="chevron" size={16} /></button></div>}
    </div>
    <div className="dashboard-grid">
      <section className="card schedule-card">
        <div className="card-header"><div><h2>Citas de hoy</h2><span>12 citas programadas</span></div><button className="link-btn" onClick={() => setPage("agenda")}>Ver agenda completa <Icon name="chevron" size={15} /></button></div>
        <div className="appointment-list">
          {appointments.map((a, i) => <button className="appointment" key={a.time} onClick={() => setPage("historial")}><div className="appointment-time"><strong>{a.time}</strong><span>{i < 3 ? "AM" : "PM"}</span></div><div className={`avatar ${a.color}`}>{a.initials}</div><div className="appointment-info"><strong>{a.name}</strong><span>{a.reason}</span></div><span className={`status ${a.status.toLowerCase().replace(" ", "-")}`}>{a.status}</span><Icon name="chevron" size={16} /></button>)}
        </div>
      </section>
      <aside className="right-column">
        <section className="card quick-card"><div className="card-header"><div><h2>Accesos rápidos</h2><span>Acciones frecuentes</span></div></div><div className="quick-grid">
          <button onClick={() => setPage("registro")}><span className="quick-icon"><Icon name="plus" /></span><b>Nuevo paciente</b><small>Registrar expediente</small></button>
          <button onClick={() => setPage("agenda")}><span className="quick-icon"><Icon name="calendar" /></span><b>Agendar cita</b><small>Nueva cita médica</small></button>
          <button onClick={() => setPage("pacientes")}><span className="quick-icon"><Icon name="search" /></span><b>Buscar historial</b><small>Consultar expediente</small></button>
          <button onClick={() => setPage("consulta")}><span className="quick-icon"><Icon name="file" /></span><b>Nueva consulta</b><small>Registrar atención</small></button>
        </div></section>
        <section className="card recent-card"><div className="card-header"><div><h2>Actividad reciente</h2></div><button className="icon-btn"><Icon name="more" /></button></div><div className="activity-item"><span><Icon name="file" size={16} /></span><p><b>Consulta guardada</b><small>María F. López · hace 18 min</small></p></div><div className="activity-item"><span><Icon name="users" size={16} /></span><p><b>Nuevo paciente registrado</b><small>Diego A. Ramírez · hace 42 min</small></p></div><div className="activity-item"><span><Icon name="calendar" size={16} /></span><p><b>Cita reprogramada</b><small>Ana L. Caal · hace 1 hora</small></p></div></section>
      </aside>
    </div>
  </div>;
}

function Patients({ setPage }: { setPage: (p: Page) => void }) {
  return <div>
    <PageTitle title="Pacientes" description="Gestiona los expedientes clínicos de tus pacientes." actions={<Button icon="plus" onClick={() => setPage("registro")}>Nuevo paciente</Button>} />
    <section className="card table-card">
      <div className="table-tools"><Search placeholder="Buscar por nombre o DPI..." /><div className="filters"><button className="filter active">Todos <b>1,302</b></button><button className="filter">Activos <b>1,284</b></button><button className="filter">Archivados <b>18</b></button><Button variant="secondary" icon="filter">Más filtros</Button></div></div>
      <div className="table-scroll"><table><thead><tr><th>PACIENTE</th><th>DPI</th><th>EDAD</th><th>TELÉFONO</th><th>ESTADO</th><th /></tr></thead><tbody>
        {patients.map(p => <tr key={p.dpi} onClick={() => setPage("historial")}><td><div className={`avatar ${p.color}`}>{p.initials}</div><div><strong>{p.name}</strong><span>Última consulta: 12 jun 2024</span></div></td><td>{p.dpi}</td><td>{p.age}</td><td>{p.phone}</td><td><span className={`status ${p.status.toLowerCase()}`}>{p.status}</span></td><td><button className="icon-btn"><Icon name="more" /></button></td></tr>)}
      </tbody></table></div>
      <div className="pagination"><span>Mostrando 1–6 de 1,302 pacientes</span><div><button disabled><Icon name="chevron" /></button><button className="active">1</button><button>2</button><button>3</button><span>…</span><button>217</button><button><Icon name="chevron" /></button></div></div>
    </section>
  </div>;
}

function Registration({ setPage, session }: { setPage: (p: Page) => void; session: Session }) {
  const isPediatric = session.institution === "pediatria";
  const isDental = session.institution === "clinica";
  const isLab = session.institution === "lab";
  const [guardianMode, setGuardianMode] = useState<"buscar" | "nuevo">("buscar");
  const notify = useConfirmation();
  if (isLab) return <div>
    <button className="back-link" onClick={() => setPage("pacientes")}><Icon name="arrow" /> Volver a pacientes</button>
    <PageTitle title="Registrar paciente" description="Crea el registro para órdenes y entrega de resultados." />
    <form className="card form-card compact-registration" onSubmit={event => { event.preventDefault(); notify("El paciente fue registrado correctamente."); setPage("historial"); }}><div className="form-section"><div className="section-title"><span>01</span><div><h2>Datos del paciente</h2><p>Identificación y contacto para resultados</p></div></div><div className="form-grid"><Field label="DPI *" placeholder="0000 00000 0000" /><Field label="Nombre completo *" placeholder="Nombres y apellidos" /><Field label="Fecha de nacimiento *" type="date" /><Field label="Sexo *"><select defaultValue=""><option value="" disabled>Seleccionar</option><option>Femenino</option><option>Masculino</option><option>Otro</option></select></Field><Field label="Teléfono *" placeholder="0000-0000" /><Field label="Correo para resultados *" type="email" placeholder="resultados@correo.com" /></div></div><div className="form-actions"><Button variant="secondary" onClick={() => setPage("pacientes")}>Cancelar</Button><Button type="submit" icon="check">Registrar paciente</Button></div></form>
  </div>;
  if (isDental) return <div>
    <button className="back-link" onClick={() => setPage("pacientes")}><Icon name="arrow" /> Volver a pacientes</button>
    <PageTitle title="Registrar paciente" description="Registro rápido para recepción odontológica." />
    <form className="card form-card compact-registration" onSubmit={event => { event.preventDefault(); notify("El paciente fue registrado correctamente."); setPage("historial"); }}>
      <div className="form-section"><div className="section-title"><span>01</span><div><h2>Datos del paciente</h2><p>Información básica de identificación y contacto</p></div></div><div className="form-grid"><Field label="DPI *" placeholder="0000 00000 0000" /><Field label="Nombre completo *" placeholder="Nombres y apellidos" /><Field label="Teléfono *" placeholder="0000-0000" /><Field label="Correo electrónico" type="email" placeholder="paciente@correo.com" /></div></div>
      <div className="form-section"><div className="section-title"><span>02</span><div><h2>Contacto de emergencia</h2><p>Persona a contactar si fuera necesario</p></div></div><div className="form-grid"><Field label="Nombre completo *" placeholder="Nombre y apellidos" /><Field label="Teléfono *" placeholder="0000-0000" /></div></div>
      <div className="form-actions"><Button variant="secondary" onClick={() => setPage("pacientes")}>Cancelar</Button><Button type="submit" icon="check">Registrar paciente</Button></div>
    </form>
  </div>;
  return <div>
    <button className="back-link" onClick={() => setPage("pacientes")}><Icon name="arrow" /> Volver a pacientes</button>
    <PageTitle title={isPediatric ? "Registrar paciente pediátrico" : "Registrar nuevo paciente"} description={isPediatric ? "Completa los datos del menor y de su encargado responsable." : "Completa la información para crear un expediente clínico."} />
    <form className="card form-card" onSubmit={(e) => { e.preventDefault(); notify("El paciente fue registrado correctamente."); setPage("historial"); }}>
      <div className="form-section"><div className="section-title"><span>01</span><div><h2>{isPediatric ? "Datos del menor" : "Datos personales"}</h2><p>Información de identificación del paciente</p></div></div><div className="form-grid">
        <Field label="Nombres *" placeholder={isPediatric ? "Ej. Mateo Sebastián" : "Ej. María Fernanda"} /><Field label="Apellidos *" placeholder={isPediatric ? "Ej. López Ramírez" : "Ej. López García"} />{!isPediatric && <Field label="DPI *" placeholder="0000 00000 0000" />}<Field label="Fecha de nacimiento *" type="date" />
        <Field label="Sexo *"><select defaultValue=""><option value="" disabled>Seleccionar</option><option>Femenino</option><option>Masculino</option><option>Otro</option></select></Field>
        {!isPediatric && <Field label="Tipo de sangre"><select defaultValue=""><option value="" disabled>Seleccionar</option><option>O+</option><option>O−</option><option>A+</option><option>A−</option><option>B+</option><option>AB+</option></select></Field>}
      </div></div>
      {isPediatric ? <div className="form-section"><div className="section-title"><span>02</span><div><h2>Encargado *</h2><p>Adulto responsable del menor</p></div></div><div><div className="guardian-switch"><button type="button" className={guardianMode === "buscar" ? "active" : ""} onClick={() => setGuardianMode("buscar")}><Icon name="search" /> Buscar encargado</button><button type="button" className={guardianMode === "nuevo" ? "active" : ""} onClick={() => setGuardianMode("nuevo")}><Icon name="plus" /> Crear nuevo</button></div>{guardianMode === "buscar" ? <div className="guardian-search"><Search placeholder="Buscar por nombre, DPI o teléfono..." /><button type="button" className="guardian-result"><div className="avatar blue">AR</div><div><strong>Ana Patricia Ramírez Gómez</strong><span>DPI 2648 90123 0101 · 5524-1098 · Madre</span></div><Icon name="check" /></button></div> : <div className="form-grid"><Field label="Nombres *" placeholder="Nombres del encargado" /><Field label="Apellidos *" placeholder="Apellidos del encargado" /><Field label="Parentesco *"><select defaultValue=""><option value="" disabled>Seleccionar</option><option>Madre</option><option>Padre</option><option>Abuelo(a)</option><option>Tutor legal</option><option>Otro</option></select></Field><Field label="Teléfono *" placeholder="0000-0000" /><Field label="Dirección *" placeholder="Zona, municipio y departamento" full /><Field label="Correo electrónico" type="email" placeholder="encargado@correo.com" /></div>}</div></div> : <>
        <div className="form-section"><div className="section-title"><span>02</span><div><h2>Información de contacto</h2><p>Datos para comunicación y ubicación</p></div></div><div className="form-grid"><Field label="Dirección *" placeholder="Zona, municipio y departamento" full /><Field label="Teléfono *" placeholder="0000-0000" /><Field label="Correo electrónico" type="email" placeholder="paciente@correo.com" /></div></div>
        <div className="form-section"><div className="section-title"><span>03</span><div><h2>Contacto de emergencia</h2><p>Persona a contactar en caso de emergencia</p></div></div><div className="form-grid"><Field label="Nombre completo *" placeholder="Nombre y apellido" /><Field label="Parentesco *" placeholder="Ej. Esposo(a), padre, madre" /><Field label="Teléfono *" placeholder="0000-0000" /></div></div>
      </>}
      <div className="form-actions"><Button variant="secondary" onClick={() => setPage("pacientes")}>Cancelar</Button><Button type="submit" icon="check">Registrar paciente</Button></div>
    </form>
  </div>;
}

function Restricted() {
  return <div className="restricted"><div><Icon name="lock" size={26} /></div><h2>Información restringida</h2><p>Tu rol de Secretaria no tiene permisos para consultar información clínica sensible.</p></div>;
}

function EmptyState({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return <div className="empty-state"><div><Icon name="file" size={27} /></div><h2>{title}</h2><p>{description}</p>{action}</div>;
}

const growthRecords = [
  { date: "12 jun 2024", months: 54, weight: "18.4", height: "108.2", head: "51.3", note: "Crecimiento adecuado" },
  { date: "14 mar 2024", months: 51, weight: "17.8", height: "106.5", head: "51.0", note: "Dentro del percentil esperado" },
  { date: "08 dic 2023", months: 48, weight: "17.1", height: "104.1", head: "50.8", note: "Sin observaciones" },
  { date: "11 sep 2023", months: 45, weight: "16.3", height: "101.8", head: "50.5", note: "Evolución favorable" },
];

function GrowthControl() {
  const [modal, setModal] = useState(false);
  const notify = useConfirmation();
  return <section className="card pediatric-panel">
    <div className="card-header"><div><h2>Control de crecimiento</h2><span>Seguimiento antropométrico del menor</span></div><Button icon="plus" onClick={() => setModal(true)}>Nuevo control</Button></div>
    <div className="growth-summary"><div><span>PESO ACTUAL</span><strong>18.4 <small>kg</small></strong><em>Percentil 62</em></div><div><span>TALLA ACTUAL</span><strong>108.2 <small>cm</small></strong><em>Percentil 58</em></div><div><span>PERÍMETRO CEFÁLICO</span><strong>51.3 <small>cm</small></strong><em>Dentro del rango</em></div></div>
    <div className="growth-chart"><div className="chart-heading"><div><h3>Evolución de peso y talla</h3><p>Últimos 12 meses</p></div><div className="chart-legend"><span><i className="weight-line" /> Peso (kg)</span><span><i className="height-line" /> Talla (cm)</span></div></div><div className="chart-area"><div className="chart-y">{["110", "100", "90", "80", "70"].map(v => <span key={v}>{v}</span>)}</div><svg viewBox="0 0 700 180" preserveAspectRatio="none" aria-label="Gráfica de evolución de peso y talla"><line x1="0" y1="15" x2="700" y2="15" /><line x1="0" y1="52" x2="700" y2="52" /><line x1="0" y1="89" x2="700" y2="89" /><line x1="0" y1="126" x2="700" y2="126" /><line x1="0" y1="163" x2="700" y2="163" /><polyline className="height-plot" points="20,126 185,105 350,82 515,57 680,35" /><polyline className="weight-plot" points="20,155 185,145 350,131 515,116 680,101" />{[[20,126],[185,105],[350,82],[515,57],[680,35]].map(([x,y]) => <circle className="height-dot" cx={x} cy={y} r="4" key={`${x}h`} />)}{[[20,155],[185,145],[350,131],[515,116],[680,101]].map(([x,y]) => <circle className="weight-dot" cx={x} cy={y} r="4" key={`${x}w`} />)}</svg><div className="chart-x"><span>JUN 23</span><span>SEP 23</span><span>DIC 23</span><span>MAR 24</span><span>JUN 24</span></div></div></div>
    <div className="growth-table"><table><thead><tr><th>FECHA</th><th>EDAD</th><th>PESO</th><th>TALLA</th><th>PERÍMETRO CEFÁLICO</th><th>OBSERVACIONES</th></tr></thead><tbody>{growthRecords.map(record => <tr key={record.date}><td><strong>{record.date}</strong></td><td>{record.months} meses</td><td>{record.weight} kg</td><td>{record.height} cm</td><td>{record.head} cm</td><td>{record.note}</td></tr>)}</tbody></table></div>
    {modal && <div className="modal-backdrop" onMouseDown={() => setModal(false)}><form className="modal" onMouseDown={event => event.stopPropagation()} onSubmit={event => { event.preventDefault(); notify("El control de crecimiento fue guardado."); setModal(false); }}><div className="modal-head"><div><h2>Nuevo control de crecimiento</h2><p>Registra las medidas actuales del menor.</p></div><button type="button" onClick={() => setModal(false)}><Icon name="close" /></button></div><div className="modal-body"><div className="form-grid"><Field label="Fecha *"><input type="date" defaultValue="2024-06-17" /></Field><Field label="Edad en meses *"><input type="number" defaultValue="54" /></Field><Field label="Peso (kg) *"><input type="number" step="0.1" placeholder="0.0" /></Field><Field label="Talla (cm) *"><input type="number" step="0.1" placeholder="0.0" /></Field><Field label="Perímetro cefálico (cm) *"><input type="number" step="0.1" placeholder="0.0" /></Field><Field label="Observaciones" full><textarea rows={3} placeholder="Hallazgos relevantes..." /></Field></div></div><div className="modal-actions"><Button variant="secondary" onClick={() => setModal(false)}>Cancelar</Button><Button type="submit">Guardar control</Button></div></form></div>}
  </section>;
}

const vaccines = [
  { name: "Pentavalente", prevents: "Difteria, tos ferina, tétanos, hepatitis B y Hib", dose: "2/3", next: "24 jun 2024", state: "pending" },
  { name: "Polio (OPV/IPV)", prevents: "Poliomielitis", dose: "2/3", next: "24 jun 2024", state: "pending" },
  { name: "Neumococo", prevents: "Neumonía y meningitis neumocócica", dose: "2/3", next: "10 jun 2024", state: "late" },
  { name: "Rotavirus", prevents: "Gastroenteritis por rotavirus", dose: "2/2", next: "Esquema completo", state: "complete" },
  { name: "BCG", prevents: "Formas graves de tuberculosis", dose: "1/1", next: "Esquema completo", state: "complete" },
  { name: "SRP", prevents: "Sarampión, rubéola y parotiditis", dose: "1/2", next: "15 ago 2024", state: "scheduled" },
];

function VaccinesPanel() {
  const [modal, setModal] = useState(false);
  const notify = useConfirmation();
  return <section className="card pediatric-panel">
    <div className="card-header"><div><h2>Esquema de vacunación</h2><span>Registro y seguimiento de dosis aplicadas</span></div><Button icon="plus" onClick={() => setModal(true)}>Registrar vacuna</Button></div>
    <div className="vaccine-notice"><Icon name="bell" /><div><strong>3 dosis requieren atención</strong><span>Dos vacunas están pendientes y una se encuentra atrasada.</span></div></div>
    <div className="vaccine-list">{vaccines.map(vaccine => <div className="vaccine-row" key={vaccine.name}><div className={`vaccine-icon ${vaccine.state}`}><Icon name={vaccine.state === "complete" ? "check" : "shield"} /></div><div className="vaccine-name"><strong>{vaccine.name}</strong><span>Previene: {vaccine.prevents}</span></div><div className="dose-progress"><span>DOSIS</span><strong>{vaccine.dose}</strong><i><b style={{ width: `${(Number(vaccine.dose[0]) / Number(vaccine.dose[2])) * 100}%` }} /></i></div><div className={`next-dose ${vaccine.state}`}><span>PRÓXIMA DOSIS</span><strong>{vaccine.next}</strong>{vaccine.state === "pending" && <em>Pendiente</em>}{vaccine.state === "late" && <em>Atrasada</em>}</div></div>)}</div>
    {modal && <div className="modal-backdrop" onMouseDown={() => setModal(false)}><form className="modal" onMouseDown={event => event.stopPropagation()} onSubmit={event => { event.preventDefault(); notify("La vacuna fue registrada correctamente."); setModal(false); }}><div className="modal-head"><div><h2>Registrar vacuna</h2><p>Agrega una dosis al esquema del menor.</p></div><button type="button" onClick={() => setModal(false)}><Icon name="close" /></button></div><div className="modal-body"><Field label="Vacuna *" full><select defaultValue=""><option value="" disabled>Seleccionar vacuna</option><option>Pentavalente</option><option>Polio (OPV/IPV)</option><option>Neumococo</option><option>Rotavirus</option><option>SRP</option></select></Field><div className="form-grid"><Field label="Número de dosis *"><input type="number" min="1" placeholder="Ej. 3" /></Field><Field label="Fecha de aplicación *"><input type="date" /></Field><Field label="Próxima fecha"><input type="date" /></Field><Field label="Observaciones" full><textarea rows={3} placeholder="Lote, reacción o información adicional..." /></Field></div></div><div className="modal-actions"><Button variant="secondary" onClick={() => setModal(false)}>Cancelar</Button><Button type="submit">Registrar vacuna</Button></div></form></div>}
  </section>;
}

function DentalHistoryTimeline() {
  const records = [
    { date: "12 jun 2024", dentist: "Dr. Luis Herrera", diagnosis: "Caries oclusal en pieza 16", treatment: "Restauración con resina fotocurable" },
    { date: "08 abr 2024", dentist: "Dra. Elena Castillo", diagnosis: "Gingivitis leve generalizada", treatment: "Profilaxis dental y aplicación de flúor" },
    { date: "19 ene 2024", dentist: "Dr. Luis Herrera", diagnosis: "Sensibilidad dentinaria en pieza 24", treatment: "Aplicación de barniz desensibilizante" },
    { date: "03 oct 2023", dentist: "Dr. Fernando Cabrera", diagnosis: "Evaluación odontológica preventiva", treatment: "Limpieza dental y educación de higiene oral" },
  ];
  return <section className="card dental-history-panel"><div className="card-header"><div><h2>Historial odontológico</h2><span>Consultas y procedimientos realizados</span></div></div><div className="dental-timeline">{records.map((record, index) => <div className="dental-record" key={record.date}><div className="dental-date"><strong>{record.date.split(" ")[0]}</strong><span>{record.date.split(" ").slice(1).join(" ").toUpperCase()}</span></div><div className="record-track"><i />{index < records.length - 1 && <b />}</div><div><span className="dentist-label">{record.dentist}</span><h3>{record.diagnosis}</h3><p><small>TRATAMIENTO REALIZADO</small>{record.treatment}</p></div></div>)}</div></section>;
}

type ToothStatus = "sano" | "caries" | "obturado" | "ausente" | "tratamiento";
const toothStatusLabels: { id: ToothStatus; label: string }[] = [
  { id: "sano", label: "Sano" },
  { id: "caries", label: "Caries" },
  { id: "obturado", label: "Obturado" },
  { id: "ausente", label: "Ausente" },
  { id: "tratamiento", label: "En tratamiento" },
];

function Odontogram({ compact = false }: { compact?: boolean }) {
  const [selected, setSelected] = useState(16);
  const [states, setStates] = useState<Record<number, ToothStatus>>({ 3: "obturado", 8: "caries", 13: "ausente", 16: "tratamiento", 19: "caries", 30: "obturado" });
  const upper = Array.from({ length: 16 }, (_, index) => index + 1);
  const lower = Array.from({ length: 16 }, (_, index) => 32 - index);
  const setToothStatus = (status: ToothStatus) => setStates(current => ({ ...current, [selected]: status }));
  return <section className={`card odontogram-panel ${compact ? "compact" : ""}`}><div className="card-header"><div><h2>Odontograma</h2><span>Selecciona una pieza dental para actualizar su estado</span></div>{!compact && <span className="updated-label">Actualizado: 12 jun 2024</span>}</div><div className="odontogram-body">
    <div className="tooth-legend">{toothStatusLabels.map(status => <span key={status.id}><i className={status.id} />{status.label}</span>)}</div>
    <div className="arch"><small>ARCADA SUPERIOR</small><div className="teeth">{upper.map(number => <button type="button" className={`${states[number] || "sano"} ${selected === number ? "selected" : ""}`} onClick={() => setSelected(number)} key={number}><i /><span>{number}</span></button>)}</div></div>
    <div className="mouth-divider"><span>DERECHA</span><i /><span>IZQUIERDA</span></div>
    <div className="arch lower"><div className="teeth">{lower.map(number => <button type="button" className={`${states[number] || "sano"} ${selected === number ? "selected" : ""}`} onClick={() => setSelected(number)} key={number}><i /><span>{number}</span></button>)}</div><small>ARCADA INFERIOR</small></div>
    <div className="tooth-editor"><div><span>PIEZA SELECCIONADA</span><strong>Diente {selected}</strong></div><div>{toothStatusLabels.map(status => <button type="button" className={states[selected] === status.id || (!states[selected] && status.id === "sano") ? "active" : ""} onClick={() => setToothStatus(status.id)} key={status.id}><i className={status.id} />{status.label}</button>)}</div></div>
  </div></section>;
}

function PaymentsPanel() {
  const payments = [
    { date: "12 jun 2024", concept: "Restauración con resina", total: "Q 650.00", status: "Pagado", methods: ["Efectivo Q 400.00", "Tarjeta Q 250.00"], fee: "Q 260.00" },
    { date: "08 abr 2024", concept: "Profilaxis y aplicación de flúor", total: "Q 425.00", status: "Pagado", methods: ["Transferencia Q 425.00"], fee: "Q 170.00" },
    { date: "19 ene 2024", concept: "Tratamiento desensibilizante", total: "Q 350.00", status: "Pendiente", methods: ["Anticipo efectivo Q 150.00"], fee: "Q 140.00" },
  ];
  return <section className="card payments-panel"><div className="card-header"><div><h2>Pagos por cita</h2><span>Detalle de cobros y honorarios profesionales</span></div><Button variant="secondary" icon="plus">Registrar pago</Button></div><div className="payments-summary"><div><span>TOTAL FACTURADO</span><strong>Q 1,425.00</strong></div><div><span>TOTAL PAGADO</span><strong>Q 1,225.00</strong></div><div><span>SALDO PENDIENTE</span><strong>Q 200.00</strong></div><div><span>HONORARIOS</span><strong>Q 570.00</strong></div></div><div className="payment-list">{payments.map(payment => <div className="payment-row" key={payment.date}><div className="payment-date"><Icon name="calendar" /><span><strong>{payment.date}</strong><small>Cita odontológica</small></span></div><div className="payment-concept"><span>CONCEPTO</span><strong>{payment.concept}</strong></div><div className="payment-method"><span>MÉTODO DE PAGO</span>{payment.methods.map(method => <small key={method}>{method}</small>)}</div><div className="payment-fee"><span>HONORARIOS</span><strong>{payment.fee}</strong></div><div className="payment-total"><span>TOTAL</span><strong>{payment.total}</strong><em className={payment.status.toLowerCase()}>{payment.status}</em></div><button className="icon-btn"><Icon name="more" /></button></div>)}</div></section>;
}

function DentalOverview({ setPage, onPayments }: { setPage: (page: Page) => void; onPayments: () => void }) {
  return <div className="dental-overview"><div className="dental-overview-main"><section className="card"><div className="card-header"><div><h2>Resumen del paciente</h2><span>Información administrativa y próximas citas</span></div><Button variant="ghost" icon="edit">Editar</Button></div><div className="dental-summary-grid"><div><span>ÚLTIMA CITA</span><strong>12 jun 2024</strong><small>Dr. Luis Herrera</small></div><div><span>PRÓXIMA CITA</span><strong>10 jul 2024 · 09:30</strong><small>Control programado</small></div><div><span>CITAS REGISTRADAS</span><strong>8</strong><small>4 durante este año</small></div><div><span>SALDO PENDIENTE</span><strong>Q 200.00</strong><small>Correspondiente a la última cita</small></div></div></section><section className="card upcoming-dental"><div className="card-header"><div><h2>Próxima cita</h2><span>Atención programada</span></div><button className="link-btn" onClick={() => setPage("agenda")}>Ver agenda <Icon name="chevron" /></button></div><div><div className="calendar-block"><strong>10</strong><span>JUL</span></div><div><strong>Control y evaluación dental</strong><span>Dr. Luis Herrera · 09:30</span><small>Duración estimada: 45 minutos</small></div><span className="status confirmada">Confirmada</span></div></section></div><aside className="history-side"><section className="card contact-card"><div className="card-header"><h2>Datos de contacto</h2><button className="icon-btn"><Icon name="edit" size={16} /></button></div><dl><dt>Teléfono</dt><dd><b>5482-7601</b></dd><dt>Correo electrónico</dt><dd>maria.fuentes@email.com</dd><dt>Contacto de emergencia</dt><dd>Ana Alvarado · Madre<br /><b>4018-2256</b></dd></dl></section><section className="card quick-payment"><div className="card-header"><h2>Estado de cuenta</h2></div><div><span>Saldo actual</span><strong>Q 200.00</strong><button onClick={onPayments}>Ver pagos</button></div></section></aside></div>;
}

const resultParameters = {
  hematologia: [
    { name: "Hemoglobina", value: "10.8", unit: "g/dL", range: "12.0 – 16.0", abnormal: true },
    { name: "Hematocrito", value: "35.2", unit: "%", range: "36.0 – 46.0", abnormal: true },
    { name: "Leucocitos", value: "7.8", unit: "10³/µL", range: "4.5 – 11.0", abnormal: false },
    { name: "Plaquetas", value: "268", unit: "10³/µL", range: "150 – 450", abnormal: false },
    { name: "Eritrocitos", value: "4.32", unit: "10⁶/µL", range: "4.0 – 5.2", abnormal: false },
    { name: "VCM", value: "81.5", unit: "fL", range: "80 – 100", abnormal: false },
  ],
  orina: [
    { name: "Color", value: "Amarillo", unit: "", range: "Amarillo", abnormal: false },
    { name: "Aspecto", value: "Ligeramente turbio", unit: "", range: "Transparente", abnormal: true },
    { name: "pH", value: "6.0", unit: "", range: "5.0 – 8.0", abnormal: false },
    { name: "Densidad", value: "1.020", unit: "", range: "1.005 – 1.030", abnormal: false },
    { name: "Proteínas", value: "Negativo", unit: "", range: "Negativo", abnormal: false },
    { name: "Glucosa", value: "Negativo", unit: "", range: "Negativo", abnormal: false },
  ],
  cultivo: [
    { name: "Microorganismo aislado", value: "Escherichia coli", unit: "", range: "Sin crecimiento", abnormal: true },
    { name: "Recuento", value: ">100,000", unit: "UFC/mL", range: "<10,000", abnormal: true },
    { name: "Amoxicilina/ác. clavulánico", value: "Sensible", unit: "", range: "Sensible", abnormal: false },
    { name: "Ciprofloxacina", value: "Resistente", unit: "", range: "Sensible", abnormal: true },
    { name: "Nitrofurantoína", value: "Sensible", unit: "", range: "Sensible", abnormal: false },
  ],
};

function LabResultForm({ onCancel, onReport }: { onCancel: () => void; onReport: () => void }) {
  const [exam, setExam] = useState<keyof typeof resultParameters>("hematologia");
  const notify = useConfirmation();
  const examNames = { hematologia: "Hematología completa", orina: "Examen general de orina", cultivo: "Cultivo y antibiograma" };
  return <section className="card lab-results-form"><div className="card-header"><div><h2>Registrar resultados</h2><span>Orden LAB-240617-018 · Andrea Lucía Pérez</span></div><button className="icon-btn" onClick={onCancel}><Icon name="close" /></button></div><div className="exam-switch">{(Object.keys(examNames) as (keyof typeof resultParameters)[]).map(key => <button className={exam === key ? "active" : ""} onClick={() => setExam(key)} key={key}>{examNames[key]}</button>)}</div><div className="parameters-head"><span>PARÁMETRO</span><span>RESULTADO</span><span>UNIDAD</span><span>RANGO DE REFERENCIA</span></div><div className="parameter-list">{resultParameters[exam].map(parameter => <label className={parameter.abnormal ? "abnormal" : ""} key={parameter.name}><strong>{parameter.name}</strong><input defaultValue={parameter.value} /><span>{parameter.unit || "—"}</span><small>{parameter.range}</small>{parameter.abnormal && <em>Fuera de rango</em>}</label>)}</div><div className="validation-fields"><Field label="Laboratorista responsable *"><select defaultValue="Lic. Ana Castillo"><option>Lic. Ana Castillo</option><option>Lic. Fernando Morales</option></select></Field><Field label="Fecha de validación *"><input type="datetime-local" defaultValue="2024-06-17T11:30" /></Field><Field label="Observaciones" full><textarea rows={3} placeholder="Observaciones técnicas o comentarios para el médico..." /></Field></div><div className="form-actions"><Button variant="secondary" onClick={onCancel}>Cancelar</Button><Button icon="check" onClick={() => { notify("Los resultados fueron validados y el reporte está disponible."); onReport(); }}>Validar resultados</Button></div></section>;
}

function LabReport({ onBack }: { onBack: () => void }) {
  return <div><div className="report-actions"><Button variant="secondary" icon="arrow" onClick={onBack}>Volver</Button><Button icon="file" onClick={() => window.print()}>Descargar PDF</Button></div><article className="lab-report"><header><Logo /><div><strong>Laboratorio Clínico</strong><span>12 calle 4-58, zona 10 · Ciudad de Guatemala</span><span>PBX 2385-4100 · resultados@laboratorioclinico.gt</span></div></header><div className="report-title"><div><span>INFORME DE RESULTADOS</span><strong>Orden LAB-240617-018</strong></div><em>VALIDADO</em></div><section className="report-patient"><div><span>PACIENTE</span><strong>Andrea Lucía Pérez Gómez</strong></div><div><span>DPI</span><strong>2748 51092 0101</strong></div><div><span>EDAD / SEXO</span><strong>36 años · Femenino</strong></div><div><span>FECHA DE INGRESO</span><strong>17 jun 2024 · 07:15</strong></div><div><span>SOLICITANTE</span><strong>Dr. Carlos Méndez</strong></div><div><span>FECHA DE VALIDACIÓN</span><strong>17 jun 2024 · 11:30</strong></div></section><ReportExam title="Hematología completa" parameters={resultParameters.hematologia} /><ReportExam title="Examen general de orina" parameters={resultParameters.orina} /><footer><div><strong>Observaciones</strong><p>Correlacionar resultados con el cuadro clínico del paciente. Valores fuera de rango resaltados.</p></div><div className="signature"><span>Firma digital validada</span><strong>Lic. Ana Castillo</strong><small>Colegiado activo No. 4821<br />Laboratorista responsable</small></div></footer><small className="report-disclaimer">Este informe fue generado electrónicamente. La firma digital garantiza su autenticidad.</small></article></div>;
}

function ReportExam({ title, parameters }: { title: string; parameters: { name: string; value: string; unit: string; range: string; abnormal: boolean }[] }) {
  return <section className="report-exam"><h2>{title}</h2><div className="report-result-head"><span>PARÁMETRO</span><span>RESULTADO</span><span>UNIDAD</span><span>RANGO DE REFERENCIA</span></div>{parameters.map(parameter => <div className={parameter.abnormal ? "abnormal" : ""} key={parameter.name}><strong>{parameter.name}</strong><b>{parameter.value}</b><span>{parameter.unit || "—"}</span><span>{parameter.range}</span></div>)}</section>;
}

function LabOrdersResults({ role, onNewOrder }: { role: AccessRole; onNewOrder: () => void }) {
  const [view, setView] = useState<"list" | "results" | "report">("list");
  if (view === "results" && role === "Secretaria") return <section className="card"><Restricted /><div className="restricted-back"><Button variant="secondary" onClick={() => setView("list")}>Volver a órdenes</Button></div></section>;
  if (view === "results") return <LabResultForm onCancel={() => setView("list")} onReport={() => setView("report")} />;
  if (view === "report") return <LabReport onBack={() => setView("list")} />;
  const historical = [
    { code: "LAB-240617-018", date: "17 jun 2024", tests: "Hematología completa · Orina", requester: "Dr. Carlos Méndez", status: "Validada" },
    { code: "LAB-240429-112", date: "29 abr 2024", tests: "Perfil lipídico · Glucosa", requester: "Clínica San Rafael", status: "Validada" },
    { code: "LAB-240315-087", date: "15 mar 2024", tests: "Cultivo · Antibiograma", requester: "Dra. Ana Lucía Soto", status: "En proceso" },
    { code: "LAB-240108-031", date: "08 ene 2024", tests: "Hematología completa", requester: "Hospital General", status: "Validada" },
    { code: "LAB-231120-204", date: "20 nov 2023", tests: "Examen general de orina", requester: "Dr. Carlos Méndez", status: "Validada" },
    { code: "LAB-231002-156", date: "02 oct 2023", tests: "Glucosa · Perfil lipídico", requester: "Centro Médico La Paz", status: "Validada" },
  ];
  return <section className="card lab-history-orders"><div className="card-header"><div><h2>Órdenes y resultados</h2><span>Historial cronológico de exámenes del paciente</span></div><div className="order-history-tools"><Search placeholder="Buscar por orden o examen..." /><Button icon="plus" onClick={onNewOrder}>Nueva orden</Button></div></div><div className="historical-head"><span>ORDEN / FECHA</span><span>EXÁMENES</span><span>SOLICITANTE</span><span>ESTADO</span><span>ACCIONES</span></div>{historical.map((order, index) => <div className="historical-order" key={order.code}><div><strong>{order.code}</strong><span>{order.date}</span></div><strong>{order.tests}</strong><span>{order.requester}</span><span className={`lab-status ${order.status.toLowerCase().replace(" ", "-")}`}><i />{order.status}</span><div><button onClick={() => setView("results")}>{role === "Secretaria" ? "Ver orden" : index === 2 ? "Registrar resultados" : "Ver resultados"}</button>{role !== "Secretaria" && order.status === "Validada" && <button onClick={() => setView("report")}><Icon name="file" size={14} /></button>}</div></div>)}<div className="pagination"><span>Mostrando 1–6 de 248 órdenes</span><div><button disabled><Icon name="chevron" /></button><button className="active">1</button><button>2</button><button>3</button><span>…</span><button>42</button><button><Icon name="chevron" /></button></div></div></section>;
}

function LabPaymentsPanel() {
  return <section className="card payments-panel"><div className="card-header"><div><h2>Pagos de laboratorio</h2><span>Cobros asociados a órdenes de examen</span></div><Button variant="secondary" icon="plus">Registrar pago</Button></div><div className="payments-summary"><div><span>TOTAL FACTURADO</span><strong>Q 1,185.00</strong></div><div><span>TOTAL PAGADO</span><strong>Q 1,185.00</strong></div><div><span>SALDO PENDIENTE</span><strong>Q 0.00</strong></div><div><span>ÚLTIMO PAGO</span><strong>Q 285.00</strong></div></div><div className="payment-list"><div className="payment-row"><div className="payment-date"><Icon name="file" /><span><strong>17 jun 2024</strong><small>LAB-240617-018</small></span></div><div className="payment-concept"><span>CONCEPTO</span><strong>Hematología y orina</strong></div><div className="payment-method"><span>MÉTODO DE PAGO</span><small>Tarjeta Q 285.00</small></div><div className="payment-fee"><span>COMPROBANTE</span><strong>REC-001842</strong></div><div className="payment-total"><span>TOTAL</span><strong>Q 285.00</strong><em className="pagado">Pagado</em></div><button className="icon-btn"><Icon name="more" /></button></div></div></section>;
}

function LabOverview({ onOrders }: { onOrders: () => void }) {
  return <div className="lab-overview"><section className="card"><div className="card-header"><div><h2>Resumen de laboratorio</h2><span>Actividad del paciente</span></div></div><div className="dental-summary-grid"><div><span>ÓRDENES REGISTRADAS</span><strong>248</strong><small>Desde marzo de 2018</small></div><div><span>ÚLTIMA ORDEN</span><strong>17 jun 2024</strong><small>Hematología completa · Orina</small></div><div><span>RESULTADOS DISPONIBLES</span><strong>247</strong><small>Un examen en proceso</small></div><div><span>MEDIO DE ENTREGA</span><strong>Correo electrónico</strong><small>andrea.perez@email.com</small></div></div><div className="overview-action"><Button icon="file" onClick={onOrders}>Ver órdenes y resultados</Button></div></section><aside className="history-side"><section className="card contact-card"><div className="card-header"><h2>Datos de entrega</h2><button className="icon-btn"><Icon name="edit" size={16} /></button></div><dl><dt>Teléfono</dt><dd><b>5638-2041</b></dd><dt>Correo para resultados</dt><dd>andrea.perez@email.com</dd><dt>Última actualización</dt><dd>17 jun 2024</dd></dl></section><section className="card quick-payment"><div className="card-header"><h2>Estado de cuenta</h2></div><div><span>Saldo actual</span><strong>Q 0.00</strong><small>Sin pagos pendientes</small></div></section></aside></div>;
}

const admittedPatients = [
  { patient: "Carlos Estuardo Méndez Soto", doctor: "Dr. Roberto Díaz", date: "14 jun 2024", days: 4, reason: "Apendicitis aguda", status: "Activo" },
  { patient: "Marta Alicia González", doctor: "Dra. Andrea Soto", date: "12 jun 2024", days: 6, reason: "Neumonía adquirida en comunidad", status: "Activo" },
  { patient: "Juan Alberto Choc", doctor: "Dr. Fernando López", date: "08 jun 2024", days: 10, reason: "Descompensación diabética", status: "Activo" },
  { patient: "Rosa Elena Ramírez", doctor: "Dra. Andrea Soto", date: "02 jun 2024", days: 5, reason: "Crisis hipertensiva", status: "Dado de alta" },
];

function HospitalizeModal({ close, onSave, patient = "María Fernanda López García" }: { close: () => void; onSave: () => void; patient?: string }) {
  const notify = useConfirmation();
  return <div className="modal-backdrop" onMouseDown={close}><form className="modal" onMouseDown={event => event.stopPropagation()} onSubmit={event => { event.preventDefault(); notify("El internamiento fue registrado correctamente."); onSave(); close(); }}><div className="modal-head"><div className="modal-title-icon hospitalize"><Icon name="heart" /></div><div><h2>Internar paciente</h2><p>Registra el ingreso y el médico responsable.</p></div><button type="button" onClick={close}><Icon name="close" /></button></div><div className="modal-body"><Field label="Paciente *" full><div className="search"><Icon name="search" /><input defaultValue={patient} /></div></Field><Field label="Médico responsable *" full><select defaultValue="Dr. Roberto Díaz"><option>Dr. Roberto Díaz</option><option>Dra. Andrea Soto</option><option>Dr. Fernando López</option></select></Field><div className="form-grid"><Field label="Fecha de ingreso *"><input type="datetime-local" defaultValue="2024-06-17T10:30" /></Field></div><Field label="Motivo del internamiento *" full><textarea rows={4} placeholder="Describe el motivo clínico del ingreso..." /></Field></div><div className="modal-actions"><Button variant="secondary" onClick={close}>Cancelar</Button><Button type="submit" icon="check">Registrar internamiento</Button></div></form></div>;
}

function HospitalizationsPage({ onHospitalize, hospitalized }: { onHospitalize: () => void; hospitalized: boolean }) {
  const [showDischarged, setShowDischarged] = useState(false);
  const allPatients = hospitalized ? [{ patient: "María Fernanda López García", doctor: "Dr. Roberto Díaz", date: "17 jun 2024", days: 2, reason: "Descompensación hipertensiva", status: "Activo" }, ...admittedPatients] : admittedPatients;
  const visible = allPatients.filter(patient => showDischarged || patient.status === "Activo");
  return <div><PageTitle title="Internamientos" description="Pacientes actualmente ingresados en el Hospital General." actions={<Button icon="plus" onClick={onHospitalize}>Internar paciente</Button>} /><section className="card table-card"><div className="table-tools"><Search placeholder="Buscar paciente o médico..." /><label className="discharged-filter"><input type="checkbox" checked={showDischarged} onChange={event => setShowDischarged(event.target.checked)} /> Mostrar dados de alta</label></div><div className="table-scroll"><table><thead><tr><th>PACIENTE</th><th>MÉDICO RESPONSABLE</th><th>FECHA DE INGRESO</th><th>DÍAS INTERNADO</th><th>MOTIVO</th><th>ESTADO</th></tr></thead><tbody>{visible.map((item, index) => <tr key={item.patient}><td><div className={`avatar ${["blue", "mint", "violet", "rose"][index]}`}>{item.patient.split(" ").slice(0, 2).map(part => part[0]).join("")}</div><div><strong>{item.patient}</strong><span>Expediente HG-2024-{842 + index}</span></div></td><td>{item.doctor}</td><td>{item.date}</td><td><strong>{item.days} días</strong></td><td>{item.reason}</td><td><span className={`admission-status ${item.status === "Activo" ? "active" : "discharged"}`}><i />{item.status}</span></td></tr>)}</tbody></table></div><div className="pagination"><span>Mostrando {visible.length} internamientos</span><div><button disabled><Icon name="chevron" /></button><button className="active">1</button><button disabled><Icon name="chevron" /></button></div></div></section></div>;
}

type InpatientMedicine = { name: string; dose: string; start: string; end: string };

function PatientHospitalizations({ role, active, onHospitalize, onDischarge, onInvoice }: { role: AccessRole; active: boolean; onHospitalize: () => void; onDischarge: () => void; onInvoice: () => void }) {
  const notify = useConfirmation();
  const [detail, setDetail] = useState(false);
  const [medicines, setMedicines] = useState<InpatientMedicine[]>([
    { name: "Ceftriaxona 1 g", dose: "1 g IV cada 24 horas", start: "17 jun 2024", end: "—" },
    { name: "Acetaminofén 500 mg", dose: "1 tableta cada 8 horas", start: "17 jun 2024", end: "—" },
    { name: "Omeprazol 40 mg", dose: "40 mg IV cada 24 horas", start: "17 jun 2024", end: "18 jun 2024" },
  ]);
  const [diets, setDiets] = useState([
    { type: "Hiposódica", start: "18 jun 2024", end: "—", notes: "Máximo 2 g de sodio al día" },
    { type: "Líquida", start: "17 jun 2024", end: "18 jun 2024", notes: "Primera fase posterior al ingreso" },
  ]);
  const [modal, setModal] = useState<"medicine" | "diet" | "discharge" | null>(null);
  const [discharged, setDischarged] = useState(!active);
  const [invoiceOffer, setInvoiceOffer] = useState(false);
  const suspendMedicine = (index: number) => {
    setMedicines(current => current.map((medicine, itemIndex) => itemIndex === index ? { ...medicine, end: "18 jun 2024" } : medicine));
    notify("El medicamento fue suspendido y se asignó la fecha de fin.");
  };
  if (!detail) return <section className="card admission-list"><div className="card-header"><div><h2>Internamientos del paciente</h2><span>Ingresos actuales e históricos</span></div>{!active && <Button icon="plus" onClick={onHospitalize}>Internar paciente</Button>}</div>{active && <button className="patient-admission active" onClick={() => { setDischarged(false); setDetail(true); }}><div><strong>Internamiento activo</strong><span>Ingreso: 17 jun 2024 · Dr. Roberto Díaz</span></div><span className="admission-status active"><i />Activo</span><Icon name="chevron" /></button>}<button className="patient-admission" onClick={() => { setDischarged(true); setDetail(true); }}><div><strong>Control de crisis hipertensiva</strong><span>03–07 febrero 2023 · 4 días de estancia</span></div><span className="admission-status discharged"><i />Dado de alta</span><Icon name="chevron" /></button></section>;
  return <div className="admission-detail"><button className="back-link" onClick={() => setDetail(false)}><Icon name="arrow" /> Volver a internamientos</button><section className="card admission-detail-head"><div><span>INTERNAMIENTO HG-I-2024-0142</span><h2>{discharged ? "Control de crisis hipertensiva" : "Observación por descompensación hipertensiva"}</h2><p>Ingreso: {discharged ? "03 feb 2023" : "17 jun 2024"} · Dr. Roberto Díaz</p></div><span className={`admission-status ${discharged ? "discharged" : "active"}`}><i />{discharged ? "Dado de alta" : "Activo"}</span>{!discharged && <Button variant="danger" onClick={() => setModal("discharge")}>Dar de alta</Button>}</section>
    <section className="card inpatient-section"><div className="card-header"><div><h2>Medicamentos del internamiento</h2><span>Tratamiento farmacológico durante la estancia</span></div>{role !== "Secretaria" && !discharged && <Button variant="secondary" icon="plus" onClick={() => setModal("medicine")}>Agregar medicamento</Button>}</div>{role === "Secretaria" ? <Restricted /> : <div className="table-scroll"><table><thead><tr><th>MEDICAMENTO</th><th>DOSIS</th><th>FECHA DE INICIO</th><th>FECHA DE FIN</th><th /></tr></thead><tbody>{medicines.map((medicine, index) => <tr key={`${medicine.name}-${index}`}><td><strong>{medicine.name}</strong><span>Catálogo hospitalario</span></td><td>{medicine.dose}</td><td>{medicine.start}</td><td>{medicine.end === "—" ? <span className="ongoing-treatment">Activo</span> : medicine.end}</td><td>{medicine.end === "—" && !discharged && <button className="suspend-btn" onClick={() => suspendMedicine(index)}>Suspender</button>}</td></tr>)}</tbody></table></div>}</section>
    <section className="card inpatient-section"><div className="card-header"><div><h2>Dieta</h2><span>Dieta actual e historial de cambios</span></div>{role !== "Secretaria" && !discharged && <Button variant="secondary" icon="edit" onClick={() => setModal("diet")}>Cambiar dieta</Button>}</div><div className="current-diet"><span>DIETA ACTUAL</span><strong>{discharged ? "Finalizada" : diets[0].type}</strong><small>{discharged ? "Cerrada al momento del alta" : diets[0].notes}</small></div><div className="table-scroll"><table><thead><tr><th>TIPO</th><th>FECHA DE INICIO</th><th>FECHA DE FIN</th><th>OBSERVACIONES</th></tr></thead><tbody>{diets.map(diet => <tr key={diet.start}><td><strong>{diet.type}</strong></td><td>{diet.start}</td><td>{discharged && diet.end === "—" ? "18 jun 2024" : diet.end}</td><td>{diet.notes}</td></tr>)}</tbody></table></div></section>
    <section className="card general-admission"><div className="card-header"><h2>Datos generales</h2></div><dl><div><dt>Médico responsable</dt><dd>Dr. Roberto Díaz</dd></div><div><dt>Motivo</dt><dd>Descompensación hipertensiva</dd></div><div><dt>Ingreso</dt><dd>17 jun 2024 · 10:30</dd></div><div><dt>Egreso</dt><dd>{discharged ? "18 jun 2024 · 15:00" : "Pendiente"}</dd></div><div><dt>Días de estancia</dt><dd>{discharged ? "2 días" : "2 días · en curso"}</dd></div></dl></section>
    {modal === "medicine" && <div className="modal-backdrop" onMouseDown={() => setModal(null)}><form className="modal" onMouseDown={event => event.stopPropagation()} onSubmit={event => { event.preventDefault(); setMedicines(current => [...current, { name: "Losartán 50 mg", dose: "1 tableta cada 24 horas", start: "18 jun 2024", end: "—" }]); notify("El medicamento fue agregado al internamiento."); setModal(null); }}><div className="modal-head"><div><h2>Agregar medicamento</h2><p>Selecciona un medicamento del catálogo hospitalario.</p></div><button type="button" onClick={() => setModal(null)}><Icon name="close" /></button></div><div className="modal-body"><Field label="Medicamento *" full><select><option>Losartán 50 mg</option><option>Ceftriaxona 1 g</option><option>Acetaminofén 500 mg</option></select></Field><Field label="Dosis e indicaciones *" full placeholder="Ej. 1 tableta cada 24 horas" /><Field label="Fecha de inicio *"><input type="date" defaultValue="2024-06-18" /></Field></div><div className="modal-actions"><Button variant="secondary" onClick={() => setModal(null)}>Cancelar</Button><Button type="submit">Agregar medicamento</Button></div></form></div>}
    {modal === "diet" && <div className="modal-backdrop" onMouseDown={() => setModal(null)}><form className="modal" onMouseDown={event => event.stopPropagation()} onSubmit={event => { event.preventDefault(); setDiets(current => [{ type: "Diabética", start: "18 jun 2024", end: "—", notes: "Control de carbohidratos" }, ...current.map((diet, index) => index === 0 ? { ...diet, end: "18 jun 2024" } : diet)]); notify("La dieta fue actualizada; la anterior se cerró automáticamente."); setModal(null); }}><div className="modal-head"><div><h2>Cambiar dieta</h2><p>La dieta actual se cerrará automáticamente.</p></div><button type="button" onClick={() => setModal(null)}><Icon name="close" /></button></div><div className="modal-body"><Field label="Tipo de dieta *" full><select><option>Blanda</option><option>Líquida</option><option>Diabética</option><option>Hiposódica</option><option>Normal</option></select></Field><Field label="Fecha de inicio *"><input type="date" defaultValue="2024-06-18" /></Field><Field label="Observaciones" full><textarea rows={3} placeholder="Indicaciones nutricionales..." /></Field></div><div className="modal-actions"><Button variant="secondary" onClick={() => setModal(null)}>Cancelar</Button><Button type="submit">Guardar dieta</Button></div></form></div>}
    {modal === "discharge" && <div className="modal-backdrop" onMouseDown={() => setModal(null)}><form className="modal" onMouseDown={event => event.stopPropagation()} onSubmit={event => { event.preventDefault(); setMedicines(current => current.map(medicine => medicine.end === "—" ? { ...medicine, end: "18 jun 2024" } : medicine)); setDiets(current => current.map(diet => diet.end === "—" ? { ...diet, end: "18 jun 2024" } : diet)); setDischarged(true); setModal(null); setInvoiceOffer(true); onDischarge(); notify("El alta fue registrada y los tratamientos activos fueron cerrados."); }}><div className="modal-head"><div className="modal-title-icon danger"><Icon name="logout" /></div><div><h2>Dar de alta</h2><p>Se cerrarán los medicamentos y la dieta activos.</p></div><button type="button" onClick={() => setModal(null)}><Icon name="close" /></button></div><div className="modal-body"><Field label="Fecha de egreso *"><input type="datetime-local" defaultValue="2024-06-18T15:00" /></Field><Field label="Observaciones de egreso" full><textarea rows={4} placeholder="Condición del paciente e indicaciones de salida..." /></Field><div className="warning-box">Al confirmar, el internamiento cambiará a “Dado de alta”.</div></div><div className="modal-actions"><Button variant="secondary" onClick={() => setModal(null)}>Cancelar</Button><Button variant="danger" type="submit">Confirmar alta</Button></div></form></div>}
    {invoiceOffer && <div className="modal-backdrop"><div className="modal"><div className="modal-head"><div className="modal-title-icon hospitalize"><Icon name="check" /></div><div><h2>Alta registrada</h2><p>El internamiento fue cerrado correctamente.</p></div></div><div className="modal-body"><p className="invoice-offer">¿Deseas generar y revisar la factura de este internamiento?</p></div><div className="modal-actions"><Button variant="secondary" onClick={() => setInvoiceOffer(false)}>Más tarde</Button><Button icon="file" onClick={() => { setInvoiceOffer(false); onInvoice(); }}>Generar factura</Button></div></div></div>}
  </div>;
}

function HospitalInvoices() {
  const notify = useConfirmation();
  const [selected, setSelected] = useState(0);
  const [paymentModal, setPaymentModal] = useState(false);
  const [paid, setPaid] = useState(false);
  const [amounts, setAmounts] = useState({ cash: "1000", card: "1500", transfer: "350" });
  const invoices = [
    { code: "FAC-2024-0187", source: "Internamiento HG-I-2024-0142", date: "18 jun 2024", total: 2850, status: paid ? "Pagada" : "Pendiente" },
    { code: "FAC-2024-0142", source: "Cita del 12 jun 2024", date: "12 jun 2024", total: 450, status: "Pagada" },
    { code: "FAC-2024-0098", source: "Cita del 28 may 2024", date: "28 may 2024", total: 350, status: "Anulada" },
  ];
  const details = selected === 0 ? [
    { concept: "Día de hospitalización", quantity: 2, price: 750 },
    { concept: "Honorarios médicos de internamiento", quantity: 1, price: 600 },
    { concept: "Ceftriaxona 1 g", quantity: 2, price: 180 },
    { concept: "Acetaminofén 500 mg", quantity: 8, price: 30 },
    { concept: "Insumos hospitalarios", quantity: 1, price: 150 },
  ] : [{ concept: "Honorarios por consulta", quantity: 1, price: invoices[selected].total }];
  const total = details.reduce((sum, item) => sum + item.quantity * item.price, 0);
  const paymentSum = Number(amounts.cash || 0) + Number(amounts.card || 0) + Number(amounts.transfer || 0);
  const registerPayment = () => {
    if (paymentSum !== total) return;
    setPaid(true);
    setPaymentModal(false);
    notify("El pago fue registrado y la factura cambió a estado Pagada.");
  };
  return <div className="billing-grid"><section className="card invoice-list"><div className="card-header"><div><h2>Facturas</h2><span>Documentos por cita o internamiento</span></div></div>{invoices.map((invoice, index) => <button className={selected === index ? "active" : ""} onClick={() => setSelected(index)} key={invoice.code}><div><strong>{invoice.code}</strong><span>{invoice.source}</span><small>{invoice.date}</small></div><div><strong>Q {invoice.total.toFixed(2)}</strong><em className={invoice.status.toLowerCase()}>{invoice.status}</em></div></button>)}</section><section className="card invoice-detail"><div className="card-header"><div><h2>{invoices[selected].code}</h2><span>Origen: {invoices[selected].source}</span></div><span className={`invoice-state ${invoices[selected].status.toLowerCase()}`}>{invoices[selected].status}</span></div><div className="table-scroll"><table><thead><tr><th>CONCEPTO</th><th>CANTIDAD</th><th>PRECIO UNITARIO</th><th>SUBTOTAL</th></tr></thead><tbody>{details.map(item => <tr key={item.concept}><td><strong>{item.concept}</strong></td><td>{item.quantity}</td><td>Q {item.price.toFixed(2)}</td><td><strong>Q {(item.quantity * item.price).toFixed(2)}</strong></td></tr>)}</tbody></table></div><div className="invoice-total"><span>TOTAL</span><strong>Q {total.toFixed(2)}</strong><small>Saldo pendiente: Q {invoices[selected].status === "Pagada" ? "0.00" : total.toFixed(2)}</small></div>{invoices[selected].status === "Pendiente" && <div className="invoice-actions"><Button icon="check" onClick={() => setPaymentModal(true)}>Registrar pago</Button></div>}</section>
    {paymentModal && <div className="modal-backdrop" onMouseDown={() => setPaymentModal(false)}><div className="modal" onMouseDown={event => event.stopPropagation()}><div className="modal-head"><div><h2>Registrar pago</h2><p>Divide el monto entre uno o varios métodos.</p></div><button onClick={() => setPaymentModal(false)}><Icon name="close" /></button></div><div className="modal-body"><div className="payment-target"><span>MONTO DEL PAGO</span><strong>Q {total.toFixed(2)}</strong></div><div className="split-payment"><Field label="Efectivo"><input type="number" value={amounts.cash} onChange={event => setAmounts({ ...amounts, cash: event.target.value })} /></Field><Field label="Tarjeta"><input type="number" value={amounts.card} onChange={event => setAmounts({ ...amounts, card: event.target.value })} /></Field><Field label="Transferencia"><input type="number" value={amounts.transfer} onChange={event => setAmounts({ ...amounts, transfer: event.target.value })} /></Field></div><div className={`payment-validation ${paymentSum === total ? "valid" : "invalid"}`}><span>Suma registrada: Q {paymentSum.toFixed(2)}</span><strong>{paymentSum === total ? "El monto coincide" : `Diferencia: Q ${Math.abs(total - paymentSum).toFixed(2)}`}</strong></div><div className="balance-box"><span>Saldo después del pago</span><strong>Q {Math.max(0, total - paymentSum).toFixed(2)}</strong></div></div><div className="modal-actions"><Button variant="secondary" onClick={() => setPaymentModal(false)}>Cancelar</Button><Button disabled={paymentSum !== total} onClick={registerPayment}>Confirmar pago</Button></div></div></div>}
  </div>;
}

function History({ setPage, session, archived, setArchiveModal, hospitalized, onHospitalize, onDischarge }: { setPage: (p: Page) => void; session: Session; archived: boolean; setArchiveModal: (v: boolean) => void; hospitalized: boolean; onHospitalize: () => void; onDischarge: () => void }) {
  const [tab, setTab] = useState("Resumen");
  const tabs = institutions[session.institution].tabs;
  const isPediatric = session.institution === "pediatria";
  const isDental = session.institution === "clinica";
  const isLab = session.institution === "lab";
  const isHospital = session.institution === "hospital";
  const restricted = session.role === "Secretaria" && ["Diagnósticos y tratamientos", "Diagnósticos y Tratamientos", "Recetas", "Historial odontológico", "Odontograma"].includes(tab);
  return <div>
    <button className="back-link" onClick={() => setPage("pacientes")}><Icon name="arrow" /> Volver a pacientes</button>
    <section className="patient-hero">
      <div className="patient-main"><div className="avatar patient-avatar">{isPediatric ? "MS" : isDental ? "MF" : isLab ? "AP" : "ML"}</div><div><div className="name-line"><h1>{isPediatric ? "Mateo Sebastián López Ramírez" : isDental ? "María José Fuentes Alvarado" : isLab ? "Andrea Lucía Pérez Gómez" : "María Fernanda López García"}</h1>{archived && <span className="archived-label">Archivado</span>}{isHospital && hospitalized && !archived && <span className="hospitalized-label"><Icon name="heart" size={12} />Internado</span>}</div><p>{isPediatric ? <><b>4 años, 6 meses</b><i />Masculino</> : isDental ? <>DPI 2854 60192 0101 <i /> 32 años <i /> Femenino</> : isLab ? <>DPI 2748 51092 0101 <i /> 36 años <i /> Femenino</> : <>DPI 2456 78213 0101 <i /> 42 años <i /> Femenino</>}</p><span>Expediente {isPediatric ? "CMP-2024-00418" : isDental ? "CO-2024-00316" : isLab ? "LAB-P-001284" : "HG-2024-00842"}</span>{isPediatric && <div className="guardian-inline"><Icon name="users" size={13} /><span>Encargada: <b>Ana Patricia Ramírez</b> · 5524-1098</span></div>}</div></div>
      {!isLab && <div className="patient-alerts"><div className="alert allergy"><Icon name="activity" /><span><small>ALERGIA</small><strong>Penicilina</strong></span></div><div className="alert blood"><Icon name="droplet" /><span><small>TIPO DE SANGRE</small><strong>O positivo</strong></span></div></div>}
      <div className="patient-actions">{!archived && <><Button variant="secondary" icon="archive" onClick={() => setArchiveModal(true)}>Archivar historial</Button>{isHospital && !hospitalized && <Button variant="secondary" icon="heart" onClick={onHospitalize}>Internar paciente</Button>}{!(isDental && session.role === "Secretaria") && <Button icon="plus" onClick={() => setPage("consulta")}>{isLab ? "Nueva orden de examen" : "Nueva consulta"}</Button>}</>}</div>
    </section>
    {archived && <div className="archive-banner"><Icon name="archive" /><div><strong>Este historial está archivado</strong><span>Modo de solo lectura. Motivo: traslado a otra institución.</span></div></div>}
    <div className="tabs">{tabs.map(t => <button className={tab === t ? "active" : ""} onClick={() => setTab(t)} key={t}>{t}</button>)}</div>
    <div className={archived ? "history-content read-only-content" : "history-content"}>{restricted ? <section className="card"><Restricted /></section> : tab === "Control de crecimiento" ? <GrowthControl /> : tab === "Vacunas" ? <VaccinesPanel /> : tab === "Historial odontológico" ? <DentalHistoryTimeline /> : tab === "Odontograma" ? <Odontogram /> : tab === "Órdenes y resultados" ? <LabOrdersResults role={session.role} onNewOrder={() => setPage("consulta")} /> : tab === "Internamientos" ? <PatientHospitalizations role={session.role} active={hospitalized} onHospitalize={onHospitalize} onDischarge={onDischarge} onInvoice={() => setTab("Facturas")} /> : tab === "Facturas" ? <HospitalInvoices /> : tab === "Pagos" ? isLab ? <LabPaymentsPanel /> : <PaymentsPanel /> : tab !== "Resumen" ? <section className="card"><EmptyState title={tab === "Consultas" ? "Este paciente aún no tiene consultas" : tab === "Citas" ? "Este paciente aún no tiene citas" : `Aún no hay información en ${tab}`} description="Cuando se registre información aparecerá en este espacio." action={tab === "Consultas" && !archived ? <Button icon="plus" onClick={() => setPage("consulta")}>Registrar consulta</Button> : undefined} /></section> :
    isDental ? <DentalOverview setPage={setPage} onPayments={() => setTab("Pagos")} /> : isLab ? <LabOverview onOrders={() => setTab("Órdenes y resultados")} /> : <div className="history-grid">
      <div className="history-main">
        <section className="card clinical-summary"><div className="card-header"><div><h2>Resumen clínico</h2><span>Información médica relevante</span></div><Button variant="ghost" icon="edit">Editar</Button></div>{isPediatric ? <div className="summary-grid"><div><small>CONDICIONES ACTIVAS</small><p><span>Rinitis alérgica leve</span></p></div><div><small>MEDICACIÓN ACTUAL</small><p><b>Loratadina jarabe</b><em>5 ml cada 24 horas, según necesidad</em></p></div><div><small>ALERGIAS</small><p><span className="danger-pill">Penicilina</span></p></div><div><small>ANTECEDENTES PERINATALES</small><p><b>Nacimiento a término · 3.2 kg</b><em>Sin complicaciones neonatales</em></p></div></div> : <div className="summary-grid"><div><small>CONDICIONES ACTIVAS</small><p><span>Hipertensión arterial</span><span>Diabetes tipo 2</span></p></div><div><small>MEDICACIÓN ACTUAL</small><p><b>Losartán 50 mg</b><em>1 tableta cada 24 horas</em><b>Metformina 850 mg</b><em>1 tableta cada 12 horas</em></p></div><div><small>ALERGIAS</small><p><span className="danger-pill">Penicilina</span></p></div><div><small>ANTECEDENTES</small><p><b>Madre: Diabetes mellitus</b><em>Padre: Hipertensión arterial</em></p></div></div>}</section>
        <section className="card timeline-card"><div className="card-header"><div><h2>Consultas recientes</h2><span>Últimas atenciones registradas</span></div><button className="link-btn" onClick={() => setTab("Consultas")}>Ver todas <Icon name="chevron" /></button></div>
          <div className="timeline-item"><div className="timeline-date"><strong>12</strong><span>JUN 2024</span></div><i /><div><span className="consultation-type">Consulta general</span><h3>Control de hipertensión arterial</h3><p>Paciente estable. Presión arterial dentro de metas terapéuticas. Se continúa tratamiento actual.</p><small>Dr. Roberto Díaz · Medicina interna</small></div></div>
          <div className="timeline-item"><div className="timeline-date"><strong>28</strong><span>MAY 2024</span></div><i /><div><span className="consultation-type">Seguimiento</span><h3>Control metabólico</h3><p>Resultados de laboratorio favorables. Se ajusta dosis de metformina.</p><small>Dra. Andrea Soto · Medicina interna</small></div></div>
        </section>
      </div>
      <aside className="history-side"><section className="card contact-card"><div className="card-header"><h2>{isPediatric ? "Datos del encargado" : "Datos de contacto"}</h2><button className="icon-btn"><Icon name="edit" size={16} /></button></div>{isPediatric ? <dl><dt>Encargada</dt><dd>Ana Patricia Ramírez Gómez · Madre</dd><dt>Teléfono</dt><dd><b>5524-1098</b></dd><dt>Correo electrónico</dt><dd>ana.ramirez@email.com</dd><dt>Dirección</dt><dd>3a. calle 8-21, zona 2<br />Mixco, Guatemala</dd></dl> : <dl><dt>Teléfono</dt><dd>5554-8132</dd><dt>Correo electrónico</dt><dd>maria.lopez@email.com</dd><dt>Dirección</dt><dd>7a. avenida 12-45, zona 7<br />Ciudad de Guatemala</dd><dt>Contacto de emergencia</dt><dd>Jorge Ramírez · Esposo<br /><b>4012-8934</b></dd></dl>}</section><section className="card vital-card"><div className="card-header"><h2>Últimos signos vitales</h2><span>12 jun 2024</span></div>{isPediatric ? <div><p><small>Frecuencia cardíaca</small><strong>92 <em>lpm</em></strong></p><p><small>Peso</small><strong>18.4 <em>kg</em></strong></p><p><small>Estatura</small><strong>108.2 <em>cm</em></strong></p><p><small>Temperatura</small><strong>36.7 <em>°C</em></strong></p></div> : <div><p><small>Presión arterial</small><strong>128/82 <em>mmHg</em></strong></p><p><small>Peso</small><strong>68.4 <em>kg</em></strong></p><p><small>Estatura</small><strong>1.62 <em>m</em></strong></p><p><small>Temperatura</small><strong>36.5 <em>°C</em></strong></p></div>}</section></aside>
    </div>}</div>
  </div>;
}

const examCatalog = [
  { id: "hematologia", name: "Hematología completa", category: "Hematología", prep: "No requiere ayuno", price: 125 },
  { id: "orina", name: "Examen general de orina", category: "Uroanálisis", prep: "Primera orina de la mañana", price: 75 },
  { id: "lipidico", name: "Perfil lipídico", category: "Química sanguínea", prep: "8 horas de ayuno", price: 180 },
  { id: "glucosa", name: "Glucosa", category: "Química sanguínea", prep: "8 horas de ayuno", price: 65 },
  { id: "cultivo", name: "Cultivo", category: "Microbiología", prep: "Según tipo de muestra", price: 240 },
];

function NewLabOrder({ setPage }: { setPage: (page: Page) => void }) {
  const [selected, setSelected] = useState(["hematologia", "orina"]);
  const [saved, setSaved] = useState(false);
  const toggleExam = (id: string) => setSelected(current => current.includes(id) ? current.filter(item => item !== id) : [...current, id]);
  const total = examCatalog.filter(exam => selected.includes(exam.id)).reduce((sum, exam) => sum + exam.price, 0);
  if (saved) return <section className="card success-state"><div><Icon name="check" size={35} /></div><h1>Orden registrada</h1><p>La orden LAB-240617-024 fue creada y está lista para la recepción de muestras.</p><div className="success-actions"><Button variant="secondary" onClick={() => setPage("inicio")}>Volver al inicio</Button><Button onClick={() => setPage("historial")}>Ver orden</Button></div></section>;
  return <div><button className="back-link" onClick={() => setPage("inicio")}><Icon name="arrow" /> Volver al inicio</button><PageTitle title="Nueva orden de examen" description="Selecciona el paciente, los exámenes requeridos y registra el pago." /><form className="new-order-layout" onSubmit={event => { event.preventDefault(); setSaved(true); }}><div className="order-main"><section className="card order-section"><div className="section-heading"><span>1</span><div><h2>Datos de la orden</h2><p>Paciente y procedencia de la solicitud</p></div></div><div className="form-grid"><Field label="Paciente *" full><div className="search"><Icon name="search" /><input defaultValue="Andrea Lucía Pérez Gómez" /></div></Field><Field label="Médico o institución solicitante *" full><input defaultValue="Dr. Carlos Méndez · Clínica Médica Integral" /></Field><Field label="Fecha de ingreso *"><input type="datetime-local" defaultValue="2024-06-17T10:20" /></Field></div></section><section className="card order-section"><div className="section-heading"><span>2</span><div><h2>Catálogo de exámenes</h2><p>Selecciona uno o varios exámenes para la orden</p></div></div><div className="exam-catalog">{examCatalog.map(exam => <button type="button" className={selected.includes(exam.id) ? "selected" : ""} onClick={() => toggleExam(exam.id)} key={exam.id}><span className="exam-check">{selected.includes(exam.id) && <Icon name="check" size={13} />}</span><div><small>{exam.category}</small><strong>{exam.name}</strong><em><Icon name="clock" size={13} />{exam.prep}</em></div><b>Q {exam.price.toFixed(2)}</b></button>)}</div></section></div><aside className="card order-payment"><div className="card-header"><div><h2>Resumen y pago</h2><span>{selected.length} exámenes seleccionados</span></div></div><div className="selected-exams">{examCatalog.filter(exam => selected.includes(exam.id)).map(exam => <div key={exam.id}><span>{exam.name}</span><strong>Q {exam.price.toFixed(2)}</strong></div>)}</div><div className="order-total"><span>TOTAL</span><strong>Q {total.toFixed(2)}</strong></div><div className="payment-method-select"><span>MÉTODO DE PAGO</span><label><input type="radio" name="payment" defaultChecked /> Efectivo</label><label><input type="radio" name="payment" /> Tarjeta</label><label><input type="radio" name="payment" /> Transferencia</label></div><div className="payment-breakdown"><Field label="Monto recibido"><input defaultValue={`Q ${total.toFixed(2)}`} /></Field><Field label="Referencia o autorización" placeholder="Opcional" /></div><Button type="submit" icon="check" disabled={selected.length === 0}>Crear orden y registrar pago</Button></aside></form></div>;
}

function DentalConsultation({ setPage }: { setPage: (page: Page) => void }) {
  const [saved, setSaved] = useState(false);
  const [scheduleModal, setScheduleModal] = useState(false);
  if (saved) return <><section className="card success-state dental-success"><div><Icon name="check" size={35} /></div><h1>Consulta odontológica guardada</h1><p>El tratamiento y los cambios del odontograma se agregaron al expediente de María José Fuentes.</p><div className="success-actions"><Button variant="secondary" onClick={() => setPage("historial")}>Volver al historial</Button><Button icon="calendar" onClick={() => setScheduleModal(true)}>Agendar próxima cita</Button></div></section>{scheduleModal && <DentalAppointmentModal close={() => setScheduleModal(false)} />}</>;
  return <div><button className="back-link" onClick={() => setPage("historial")}><Icon name="arrow" /> Volver al historial</button><PageTitle title="Nueva consulta odontológica" description="María José Fuentes Alvarado · CO-2024-00316" /><form onSubmit={event => { event.preventDefault(); setSaved(true); }}><section className="card dental-consultation"><div className="section-heading"><span>1</span><div><h2>Atención odontológica</h2><p>Registra el diagnóstico y el procedimiento realizado.</p></div></div><div className="form-grid"><Field label="Diagnóstico *" full><textarea rows={4} placeholder="Describe el diagnóstico odontológico y las piezas afectadas..." /></Field><Field label="Tratamiento realizado *" full><textarea rows={5} placeholder="Detalla los procedimientos, materiales y observaciones..." /></Field></div></section><div className="consultation-odontogram"><Odontogram compact /></div><section className="card next-control-card"><div className="section-heading"><span>3</span><div><h2>Seguimiento</h2><p>Sugiere una fecha para el próximo control.</p></div></div><Field label="Próximo control sugerido"><input type="date" defaultValue="2024-07-10" /></Field><div className="form-actions"><Button variant="secondary" onClick={() => setPage("historial")}>Cancelar</Button><Button type="submit" icon="check">Guardar consulta</Button></div></section></form></div>;
}

function Consultation({ setPage, session, onHospitalize }: { setPage: (p: Page) => void; session: Session; onHospitalize: () => void }) {
  const [step, setStep] = useState(1);
  const [saved, setSaved] = useState(false);
  const isPediatric = session.institution === "pediatria";
  const labels = ["Motivo y notas", "Diagnósticos", "Tratamiento", "Receta"];
  if (session.institution === "lab") return <NewLabOrder setPage={setPage} />;
  if (session.institution === "clinica") return session.role === "Secretaria" ? <section className="card"><Restricted /></section> : <DentalConsultation setPage={setPage} />;
  if (saved) return <section className="card success-state"><div><Icon name="check" size={35} /></div><h1>Consulta guardada</h1><p>La atención fue agregada correctamente al historial de {isPediatric ? "Mateo Sebastián López" : "María Fernanda López"}.</p><div className="success-actions"><Button variant="secondary" onClick={() => setPage("historial")}>Volver al historial</Button>{session.institution === "hospital" && <Button icon="heart" onClick={onHospitalize}>Internar paciente</Button>}</div></section>;
  return <div>
    <button className="back-link" onClick={() => setPage("historial")}><Icon name="arrow" /> Volver al historial</button>
    <PageTitle title="Nueva consulta" description={isPediatric ? "Mateo Sebastián López Ramírez · CMP-2024-00418" : "María Fernanda López García · HG-2024-00842"} />
    <div className="stepper">{labels.map((l, i) => <div className={step > i ? "active" : ""} key={l}><span>{step > i + 1 ? <Icon name="check" size={15} /> : i + 1}</span><b>{l}</b>{i < 3 && <i />}</div>)}</div>
    <section className="card consultation-card">
      {step === 1 && <><div className="section-heading"><span>1</span><div><h2>Motivo de consulta y notas</h2><p>Registra la información inicial de la atención.</p></div></div><div className="form-grid"><Field label="Motivo de consulta *" placeholder="Ej. Control de hipertensión" full /><Field label="Notas clínicas *" full><textarea rows={6} placeholder="Describe síntomas, evolución y hallazgos relevantes..." /></Field><Field label="Presión arterial" placeholder="Ej. 120/80 mmHg" /><Field label="Temperatura" placeholder="Ej. 36.5 °C" /></div></>}
      {step === 2 && <><div className="section-heading"><span>2</span><div><h2>Diagnósticos</h2><p>Agrega uno o varios diagnósticos para esta consulta.</p></div></div><div className="diagnosis-box"><Search placeholder="Buscar diagnóstico por nombre o código CIE-10..." /><div className="selected-diagnosis"><span>I10</span><div><strong>Hipertensión esencial (primaria)</strong><small>Diagnóstico principal</small></div><button><Icon name="close" /></button></div><Button variant="secondary" icon="plus">Agregar otro diagnóstico</Button></div></>}
      {step === 3 && <><div className="section-heading"><span>3</span><div><h2>Tratamiento por diagnóstico</h2><p>Define el plan terapéutico para cada diagnóstico.</p></div></div><div className="treatment-title"><span>I10</span><strong>Hipertensión esencial (primaria)</strong></div><Field label="Plan de tratamiento *" full><textarea rows={6} defaultValue="Continuar tratamiento farmacológico actual. Mantener dieta baja en sodio y realizar actividad física moderada 30 minutos, 5 veces por semana." /></Field><Field label="Próximo control"><input type="date" defaultValue="2024-07-17" /></Field></>}
      {step === 4 && <><div className="section-heading"><span>4</span><div><h2>Receta médica</h2><p>Busca medicamentos del catálogo y completa la indicación.</p></div></div>{isPediatric && <div className="weight-reference"><Icon name="activity" /><div><span>PESO ACTUAL PARA DOSIFICACIÓN</span><strong>18.4 kg</strong></div><small>Registrado el 12 jun 2024</small></div>}<Search placeholder="Buscar medicamento en el catálogo..." /><div className="medicine-card"><div className="medicine-head"><div className="med-icon">Rx</div><div><strong>{isPediatric ? "Acetaminofén 120 mg/5 ml" : "Losartán potásico 50 mg"}</strong><span>{isPediatric ? "Suspensión oral · Vía oral" : "Tabletas · Vía oral"}</span></div><button><Icon name="close" /></button></div><div className="medicine-fields"><Field label="Dosis"><input defaultValue={isPediatric ? "7.5 ml" : "1 tableta"} /></Field><Field label="Frecuencia"><input defaultValue={isPediatric ? "Cada 6 horas" : "Cada 24 horas"} /></Field><Field label="Duración"><input defaultValue={isPediatric ? "3 días" : "30 días"} /></Field><Field label="Indicaciones" full><input defaultValue={isPediatric ? "Administrar solo en caso de fiebre mayor a 38 °C." : "Tomar por la mañana, después del desayuno."} /></Field></div></div><Button variant="secondary" icon="plus">Agregar medicamento</Button></>}
      <div className="form-actions"><Button variant="secondary" disabled={step === 1} onClick={() => setStep(s => s - 1)}>Anterior</Button>{step < 4 ? <Button onClick={() => setStep(s => s + 1)}>Continuar <Icon name="chevron" size={16} /></Button> : <Button icon="check" onClick={() => setSaved(true)}>Guardar consulta</Button>}</div>
    </section>
  </div>;
}

function Agenda() {
  const [view, setView] = useState<"Día" | "Semana">("Día");
  const [modal, setModal] = useState(false);
  const notify = useConfirmation();
  const times = ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00"];
  return <div>
    <PageTitle title="Agenda" description="Organiza y administra las citas médicas." actions={<Button icon="plus" onClick={() => setModal(true)}>Nueva cita</Button>} />
    <section className="card agenda-card"><div className="agenda-toolbar"><div className="date-nav"><button><Icon name="chevron" /></button><div><strong>Lunes, 17 de junio</strong><span>2024</span></div><button><Icon name="chevron" /></button><button className="today">Hoy</button></div><div className="view-switch">{(["Día", "Semana"] as const).map(v => <button className={view === v ? "active" : ""} onClick={() => setView(v)} key={v}>{v}</button>)}</div></div>
      {view === "Día" ? <div className="day-calendar">{times.map((time, i) => <div className="time-row" key={time}><span>{time}</span><div>{[0,1,2,3,6].includes(i) && <button className={`calendar-event e${i}`} onClick={() => setModal(true)}><strong>{appointments[Math.min(i, 4)].name}</strong><small>{appointments[Math.min(i, 4)].reason} · 45 min</small><i>{appointments[Math.min(i, 4)].status}</i></button>}</div></div>)}</div> :
      <div className="week-calendar"><div className="week-head"><span>HORA</span>{["LUN 17", "MAR 18", "MIÉ 19", "JUE 20", "VIE 21"].map((d, i) => <b className={i === 0 ? "today-col" : ""} key={d}>{d}<strong>{17+i}</strong></b>)}</div>{times.slice(0, 6).map((t, row) => <div className="week-row" key={t}><span>{t}</span>{[0,1,2,3,4].map(col => <div key={col}>{(row + col) % 4 === 0 && <i className={`week-event c${col}`}>{patients[(row+col)%patients.length].name.split(" ").slice(0,2).join(" ")}</i>}</div>)}</div>)}</div>}
    </section>
    {modal && <div className="modal-backdrop" onMouseDown={() => setModal(false)}><form className="modal" onMouseDown={e => e.stopPropagation()} onSubmit={e => { e.preventDefault(); notify("La cita fue agendada correctamente."); setModal(false); }}><div className="modal-head"><div><h2>Nueva cita</h2><p>Programa una nueva atención médica.</p></div><button type="button" onClick={() => setModal(false)}><Icon name="close" /></button></div><div className="modal-body"><Field label="Paciente *" full><select><option>María Fernanda López García</option><option>Carlos Estuardo Méndez Soto</option></select></Field><Field label="Médico *" full><select><option>Dr. Roberto Díaz</option><option>Dra. Andrea Soto</option></select></Field><div className="form-grid"><Field label="Fecha *"><input type="date" defaultValue="2024-06-17" /></Field><Field label="Hora *"><input type="time" defaultValue="09:30" /></Field></div><Field label="Motivo *" full placeholder="Motivo de la cita" /></div><div className="modal-actions"><Button variant="secondary" onClick={() => setModal(false)}>Cancelar</Button><Button type="submit">Agendar cita</Button></div></form></div>}
  </div>;
}

function ArchiveModal({ close, confirm }: { close: () => void; confirm: () => void }) {
  const notify = useConfirmation();
  return <div className="modal-backdrop" onMouseDown={close}><form className="modal" onMouseDown={e => e.stopPropagation()} onSubmit={e => { e.preventDefault(); notify("El historial fue archivado y quedó en modo de solo lectura."); confirm(); }}><div className="modal-head"><div className="modal-title-icon danger"><Icon name="archive" /></div><div><h2>Archivar historial</h2><p>Esta acción cambiará el expediente a modo solo lectura.</p></div><button type="button" onClick={close}><Icon name="close" /></button></div><div className="modal-body"><Field label="Motivo del archivo *" full><select defaultValue="Traslado"><option>Traslado</option><option>Fallecimiento</option><option>Otro</option></select></Field><Field label="Observación" full><textarea rows={4} placeholder="Agrega información relevante sobre el archivo..." /></Field><div className="warning-box">Podrás consultar este historial, pero no será posible agregar nueva información clínica.</div></div><div className="modal-actions"><Button variant="secondary" onClick={close}>Cancelar</Button><Button variant="danger" type="submit">Archivar historial</Button></div></form></div>;
}

function Login({ onLogin }: { onLogin: (session: Session) => void }) {
  const [username, setUsername] = useState("medico.hospital");
  const matchedUser = demoUsers.find(user => user.username === username);
  const matchedInstitution = matchedUser ? institutions[matchedUser.institution] : null;
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (matchedUser) onLogin(matchedUser);
  };
  return <main className="login-page"><div className="login-brand-panel"><Logo /><div className="login-message"><span>HISTORIA CLÍNICA CONECTADA</span><h1>Una atención más humana comienza con mejor información.</h1><p>Accede de forma segura al expediente clínico unificado de tu institución.</p><div className="institution-list"><div><Icon name="shield" /><span><b>4 instituciones conectadas</b><small>Información segura y disponible</small></span></div><div><Icon name="activity" /><span><b>Atención continua</b><small>Datos clínicos cuando los necesitas</small></span></div></div></div><small>© 2024 Medis · Plataforma de gestión clínica</small></div><div className="login-form-panel"><form className="login-form" onSubmit={submit}><div className="mobile-logo"><Logo /></div><span className="welcome-label">BIENVENIDO</span><h2>Inicia sesión en tu cuenta</h2><p>Ingresa tus credenciales institucionales para continuar.</p><Field label="Usuario" full><input value={username} onChange={event => setUsername(event.target.value)} placeholder="nombre.apellido" /></Field><Field label="Contraseña" full><div className="password-wrap"><input type="password" defaultValue="demostracion" /><Icon name="lock" /></div></Field><div className="login-options"><label><input type="checkbox" defaultChecked /> Recordarme</label><button type="button">¿Olvidaste tu contraseña?</button></div><Button type="submit" disabled={!matchedUser}>Ingresar al sistema</Button>{matchedInstitution && <div className="detected"><Icon name="shield" /><div><span>Institución detectada</span><strong>{matchedInstitution.name} · {matchedInstitution.database}</strong></div><Icon name="check" /></div>}<div className="demo-users"><span>Usuarios de demostración</span><div>{demoUsers.map(user => <button type="button" className={username === user.username ? "active" : ""} onClick={() => setUsername(user.username)} key={user.username}>{user.username}</button>)}</div><small>Contraseña: demostracion</small></div><small className="login-help">¿Problemas para ingresar? <b>Contacta a soporte técnico</b></small></form></div></main>;
}

export default function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [page, setPage] = useState<Page>("inicio");
  const [session, setSession] = useState<Session>(demoUsers[0]);
  const [archiveModal, setArchiveModal] = useState(false);
  const [archived, setArchived] = useState(false);
  const [hospitalized, setHospitalized] = useState(false);
  const [hospitalizeModal, setHospitalizeModal] = useState(false);
  if (!loggedIn) return <ConfirmationProvider><Login onLogin={selectedSession => { setSession(selectedSession); setLoggedIn(true); setPage("inicio"); setArchived(false); setHospitalized(false); }} /></ConfirmationProvider>;
  return <ConfirmationProvider><div className="app-shell"><Sidebar page={page} setPage={setPage} logout={() => setLoggedIn(false)} session={session} /><div className="app-main"><Topbar session={session} /><main className="content">
    {page === "inicio" && <Dashboard setPage={setPage} session={session} />}
    {page === "pacientes" && <Patients setPage={setPage} />}
    {page === "registro" && <Registration setPage={setPage} session={session} />}
    {page === "historial" && <History setPage={setPage} session={session} archived={archived} setArchiveModal={setArchiveModal} hospitalized={hospitalized} onHospitalize={() => setHospitalizeModal(true)} onDischarge={() => setHospitalized(false)} />}
    {page === "consulta" && <Consultation setPage={setPage} session={session} onHospitalize={() => setHospitalizeModal(true)} />}
    {page === "agenda" && <Agenda />}
    {page === "internamientos" && session.institution === "hospital" && <HospitalizationsPage onHospitalize={() => setHospitalizeModal(true)} hospitalized={hospitalized} />}
  </main></div>{archiveModal && <ArchiveModal close={() => setArchiveModal(false)} confirm={() => { setArchived(true); setArchiveModal(false); }} />}{hospitalizeModal && <HospitalizeModal close={() => setHospitalizeModal(false)} onSave={() => setHospitalized(true)} />}</div></ConfirmationProvider>;
}
