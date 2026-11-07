import { useState } from "react";
import { api } from "../../api/cliente";
import type { Cita, ItemCatalogo, Paciente } from "../../api/tipos";
import { useNav } from "../../navegacion";
import { useUsuario } from "../../sesion";
import { Avatar, Button, Cargando, ErrorCaja, Field, Icon, Modal, PageTitle, hoyISO, useAviso, useCarga } from "../../ui/componentes";
import SelectorPaciente from "../../ui/SelectorPaciente";

const DIAS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
const ESTADOS: Record<Cita["estado"], string> = { programada: "Programada", atendida: "Atendida", cancelada: "Cancelada" };

const aFecha = (iso: string) => new Date(iso + "T12:00:00");
const sumarDias = (iso: string, n: number) => {
  const d = aFecha(iso);
  d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
const fechaLarga = (iso: string) => {
  const d = aFecha(iso);
  return `${DIAS[d.getDay()][0].toUpperCase()}${DIAS[d.getDay()].slice(1)}, ${d.getDate()} de ${MESES[d.getMonth()]}`;
};

export default function Agenda() {
  const [fecha, setFecha] = useState(hoyISO());
  const [medico, setMedico] = useState("");
  const [nueva, setNueva] = useState(false);
  const [detalle, setDetalle] = useState<Cita | null>(null);

  const { datos: medicos } = useCarga(() => api.get<ItemCatalogo[]>("/catalogos/medicos"), []);
  const { datos: citas, error, cargando, recargar } = useCarga(
    () => api.get<Cita[]>(`/hospital/citas?fecha=${fecha}${medico ? `&id_medico=${medico}` : ""}`),
    [fecha, medico]
  );

  // Filas de 07:00 a 17:00 más cualquier hora que tenga citas
  const lista = citas ?? [];
  const horas = [...new Set([...Array.from({ length: 11 }, (_, i) => i + 7), ...lista.map((c) => Number(c.hora.slice(0, 2)))])].sort((a, b) => a - b);
  const programadas = lista.filter((c) => c.estado === "programada").length;

  return <div>
    <PageTitle title="Agenda" description="Citas médicas del Hospital General." actions={<Button icon="plus" onClick={() => setNueva(true)}>Nueva cita</Button>} />
    <section className="card agenda-card">
      <div className="agenda-toolbar">
        <div className="date-nav">
          <button onClick={() => setFecha(sumarDias(fecha, -1))} aria-label="Día anterior"><Icon name="chevron" /></button>
          <div><strong>{fechaLarga(fecha)}</strong><span>{fecha.slice(0, 4)} · {lista.length} citas · {programadas} por atender</span></div>
          <button onClick={() => setFecha(sumarDias(fecha, 1))} aria-label="Día siguiente"><Icon name="chevron" /></button>
          <button className="today" onClick={() => setFecha(hoyISO())}>Hoy</button>
          <input type="date" className="date-picker" value={fecha} onChange={(e) => e.target.value && setFecha(e.target.value)} />
        </div>
        <select className="doctor-filter" value={medico} onChange={(e) => setMedico(e.target.value)}>
          <option value="">Todos los médicos</option>
          {(medicos ?? []).map((m) => <option key={m.id} value={m.id}>{m.nombre} · {m.especialidad}</option>)}
        </select>
      </div>
      {cargando ? <Cargando /> : error ? <div className="card-pad"><ErrorCaja error={error} reintentar={recargar} /></div> :
        <div className="day-calendar">{horas.map((h) => {
          const delaHora = lista.filter((c) => Number(c.hora.slice(0, 2)) === h);
          return <div className="time-row" key={h}><span>{String(h).padStart(2, "0")}:00</span><div className="slot-events">
            {delaHora.map((c) => <button key={c.id} className={`calendar-event cita-${c.estado}`} onClick={() => setDetalle(c)}>
              <strong>{c.hora} · {c.paciente}</strong><small>{c.medico} · {c.especialidad}</small><i>{ESTADOS[c.estado]}</i>
            </button>)}
          </div></div>;
        })}</div>}
    </section>
    {nueva && <NuevaCitaModal fechaInicial={fecha < hoyISO() ? hoyISO() : fecha} medicos={medicos ?? []} cerrar={() => setNueva(false)} listo={(c) => { setNueva(false); setFecha(c.fecha); recargar(); }} />}
    {detalle && <DetalleCitaModal cita={detalle} cerrar={() => setDetalle(null)} cambio={() => { setDetalle(null); recargar(); }} />}
  </div>;
}

// ---------- Nueva cita ----------

export function NuevaCitaModal({ fechaInicial, medicos, paciente: pacienteFijo, cerrar, listo }: {
  fechaInicial: string;
  medicos: ItemCatalogo[];
  paciente?: Paciente;
  cerrar: () => void;
  listo: (c: Cita) => void;
}) {
  const aviso = useAviso();
  const [paciente, setPaciente] = useState<Paciente | null>(pacienteFijo ?? null);
  const [medico, setMedico] = useState(medicos[0]?.id ?? "");
  const [fecha, setFecha] = useState(fechaInicial);
  const [hora, setHora] = useState("08:00");
  const [enviando, setEnviando] = useState(false);

  const guardar = async () => {
    if (!paciente || !medico) return;
    setEnviando(true);
    try {
      const cita = await api.post<Cita>("/hospital/citas", { id_paciente: paciente.id, id_medico: medico, fecha, hora });
      aviso.ok(`${cita.paciente} · ${fechaLarga(cita.fecha)} a las ${cita.hora}.`, "Cita agendada");
      listo(cita);
    } catch (err) {
      aviso.error(err);
      setEnviando(false);
    }
  };

  return <Modal titulo="Nueva cita" descripcion="Programa una atención con un médico del hospital." icono="calendar" cerrar={cerrar} onSubmit={guardar}
    acciones={<><Button variant="secondary" onClick={cerrar}>Cancelar</Button><Button type="submit" icon="calendar" disabled={!paciente || !medico || enviando}>{enviando ? "Agendando..." : "Agendar cita"}</Button></>}>
    <Field label="Paciente *" full>{paciente ? <div className="chosen-patient"><Avatar nombre={`${paciente.nombres} ${paciente.apellidos}`} /><div><strong>{paciente.nombres} {paciente.apellidos}</strong></div>{!pacienteFijo && <Button variant="ghost" onClick={() => setPaciente(null)}>Cambiar</Button>}</div> : <SelectorPaciente onElegir={setPaciente} />}</Field>
    <Field label="Médico *" full><select value={medico} onChange={(e) => setMedico(e.target.value)}>{medicos.map((m) => <option key={m.id} value={m.id}>{m.nombre} · {m.especialidad}</option>)}</select></Field>
    <div className="form-grid"><Field label="Fecha *"><input type="date" min={hoyISO()} value={fecha} onChange={(e) => setFecha(e.target.value)} required /></Field><Field label="Hora *"><input type="time" value={hora} onChange={(e) => setHora(e.target.value)} required /></Field></div>
    <p className="hint">El sistema no permite dos citas del mismo médico a la misma hora.</p>
  </Modal>;
}

// ---------- Detalle / reprogramar / cancelar ----------

function DetalleCitaModal({ cita, cerrar, cambio }: { cita: Cita; cerrar: () => void; cambio: () => void }) {
  const usuario = useUsuario();
  const { ir } = useNav();
  const aviso = useAviso();
  const [modo, setModo] = useState<"ver" | "reprogramar" | "cancelar">("ver");
  const [fecha, setFecha] = useState(cita.fecha < hoyISO() ? hoyISO() : cita.fecha);
  const [hora, setHora] = useState(cita.hora);
  const [enviando, setEnviando] = useState(false);
  const programada = cita.estado === "programada";

  const enviar = async () => {
    setEnviando(true);
    try {
      if (modo === "reprogramar") {
        await api.patch(`/hospital/citas/${cita.id}`, { fecha, hora });
        aviso.ok(`Nueva fecha: ${fechaLarga(fecha)} a las ${hora}.`, "Cita reprogramada");
      } else {
        await api.patch(`/hospital/citas/${cita.id}/cancelar`);
        aviso.ok(`La cita de ${cita.paciente} fue cancelada.`, "Cita cancelada");
      }
      cambio();
    } catch (err) {
      aviso.error(err);
      setEnviando(false);
    }
  };

  const acciones = modo === "ver"
    ? <>{programada && <Button variant="secondary" onClick={() => setModo("cancelar")}>Cancelar cita</Button>}{programada && <Button variant="secondary" icon="edit" onClick={() => setModo("reprogramar")}>Reprogramar</Button>}
        {programada && usuario.rol === "medico" ? <Button icon="file" onClick={() => ir("atencion", cita.id_paciente, cita.id)}>Atender</Button> : <Button icon="users" onClick={() => ir("historial", cita.id_paciente)}>Ver expediente</Button>}</>
    : <><Button variant="secondary" onClick={() => setModo("ver")}>Volver</Button><Button type="submit" variant={modo === "cancelar" ? "danger" : "primary"} disabled={enviando}>{modo === "cancelar" ? "Confirmar cancelación" : "Guardar cambios"}</Button></>;

  return <Modal titulo={modo === "reprogramar" ? "Reprogramar cita" : modo === "cancelar" ? "Cancelar cita" : "Detalle de la cita"} descripcion={`${cita.paciente} · ${cita.medico}`} icono={modo === "cancelar" ? "close" : "calendar"} peligro={modo === "cancelar"} cerrar={cerrar} onSubmit={enviar} acciones={acciones}>
    {modo === "ver" && <dl className="detail-list">
      <div><dt>Fecha</dt><dd>{fechaLarga(cita.fecha)} · {cita.hora}</dd></div>
      <div><dt>Médico</dt><dd>{cita.medico} · {cita.especialidad}</dd></div>
      <div><dt>Estado</dt><dd><span className={`status cita-estado-${cita.estado}`}>{ESTADOS[cita.estado]}</span></dd></div>
    </dl>}
    {modo === "reprogramar" && <div className="form-grid"><Field label="Nueva fecha *"><input type="date" min={hoyISO()} value={fecha} onChange={(e) => setFecha(e.target.value)} /></Field><Field label="Nueva hora *"><input type="time" value={hora} onChange={(e) => setHora(e.target.value)} /></Field></div>}
    {modo === "cancelar" && <div className="warning-box">La cita quedará como cancelada y ya no se podrá modificar ni atender.</div>}
  </Modal>;
}
