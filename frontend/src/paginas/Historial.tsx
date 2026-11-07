import { useState } from "react";
import { api } from "../api/cliente";
import type { Atencion, Historial as HistorialT, Paciente } from "../api/tipos";
import { INSTITUCIONES, PESTANAS_RESTRINGIDAS } from "../instituciones";
import { useNav } from "../navegacion";
import { useUsuario } from "../sesion";
import { ESTADO_ORDEN } from "./laboratorio/util";
import {
  Avatar, Button, Cargando, EmptyState, ErrorCaja, Field, Icon, Modal, Restricted,
  edad, fechaCorta, formatoDpi, formatoTelefono, horaDe, sexoTexto, useAviso, useCarga,
} from "../ui/componentes";

type Props = { id: string };

export default function Historial({ id }: Props) {
  const usuario = useUsuario();
  const { ir } = useNav();
  const [pestana, setPestana] = useState("Resumen");
  const [archivar, setArchivar] = useState(false);
  const esMedico = usuario.rol === "medico";
  const inst = INSTITUCIONES[usuario.institucion];
  const esLab = usuario.institucion === "laboratorio";

  // La ficha la ven todos; el historial clínico solo el personal médico
  const { datos, error, cargando, recargar } = useCarga(async () => {
    const paciente = await api.get<Paciente>(`/pacientes/${id}`);
    const historial = esMedico ? await api.get<HistorialT>(`/pacientes/${id}/historial`) : null;
    return { paciente, historial };
  }, [id]);

  if (cargando && !datos) return <Cargando texto="Cargando expediente..." />;
  if (error) return <div><button className="back-link" onClick={() => ir("pacientes")}><Icon name="arrow" /> Volver a pacientes</button><ErrorCaja error={error} reintentar={recargar} /></div>;
  if (!datos) return null;

  const { paciente, historial } = datos;
  const archivado = paciente.estado === "archivado";
  const nombre = `${paciente.nombres} ${paciente.apellidos}`;
  const alergias = (historial?.antecedentes ?? []).filter((a) => a.tipo.toLowerCase().includes("alerg"));
  const internamientoActivo = (historial?.extra?.internamientos ?? []).find((i: { estado: string }) => i.estado === "activo");
  const puedeAtender = !archivado && (esMedico || esLab);
  const restringida = !esMedico && PESTANAS_RESTRINGIDAS.includes(pestana);

  return <div>
    <button className="back-link" onClick={() => ir("pacientes")}><Icon name="arrow" /> Volver a pacientes</button>

    <section className="patient-hero">
      <div className="patient-main"><Avatar nombre={nombre} className="patient-avatar" /><div>
        <div className="name-line"><h1>{nombre}</h1>{archivado && <span className="archived-label">Archivado</span>}{internamientoActivo && !archivado && <span className="hospitalized-label"><Icon name="heart" size={12} />Internado</span>}</div>
        <p>{formatoDpi(paciente.dpi)} <i /> {edad(paciente.fecha_nacimiento)} <i /> {sexoTexto(paciente.sexo)}</p>
        <span>Expediente {esLab ? "LAB" : "HG"}-{paciente.id.slice(-6).toUpperCase().padStart(6, "0")} · Registrado el {fechaCorta(paciente.extra?.fecha_registro)}</span>
      </div></div>
      {!esLab && <div className="patient-alerts">
        {alergias.length > 0 && <div className="alert allergy"><Icon name="activity" /><span><small>ALERGIA</small><strong>{alergias[0].descripcion || alergias[0].tipo}</strong></span></div>}
        {paciente.extra?.tipo_sangre && <div className="alert blood"><Icon name="droplet" /><span><small>TIPO DE SANGRE</small><strong>{paciente.extra.tipo_sangre}</strong></span></div>}
      </div>}
      <div className="patient-actions">{!archivado && <>
        <Button variant="secondary" icon="archive" onClick={() => setArchivar(true)}>Archivar historial</Button>
        {puedeAtender && <Button icon="plus" onClick={() => ir("atencion", paciente.id)}>{esLab ? "Nueva orden de examen" : "Nueva consulta"}</Button>}
      </>}</div>
    </section>

    {archivado && <div className="archive-banner"><Icon name="archive" /><div><strong>Este historial está archivado desde el {fechaCorta(paciente.extra?.fecha_baja)}</strong><span>Modo de solo lectura. Motivo: {paciente.extra?.motivo_baja}</span></div></div>}

    <div className="tabs">{inst.pestanas.map((t) => <button className={pestana === t ? "active" : ""} onClick={() => setPestana(t)} key={t}>{t}{!esMedico && PESTANAS_RESTRINGIDAS.includes(t) && <Icon name="lock" size={12} />}</button>)}</div>

    <div className="history-content">
      {restringida ? <section className="card"><Restricted texto="Tu rol de Secretaria no tiene permisos para consultar información clínica restringida." /></section>
        : pestana === "Resumen" ? (esLab ? <ResumenLaboratorio paciente={paciente} historial={historial} irOrdenes={() => setPestana("Órdenes y resultados")} /> : <ResumenClinico paciente={paciente} historial={historial} verConsultas={() => setPestana("Consultas")} />)
        : pestana === "Consultas" ? <Consultas atenciones={historial!.atenciones} />
        : pestana === "Diagnósticos y tratamientos" ? <Diagnosticos atenciones={historial!.atenciones} />
        : pestana === "Recetas" ? <Recetas atenciones={historial!.atenciones} />
        : pestana === "Antecedentes" ? <Antecedentes paciente={paciente} historial={historial!} recargar={recargar} />
        : pestana === "Internamientos" ? <InternamientosPaciente historial={historial} />
        : pestana === "Órdenes y resultados" ? <OrdenesPaciente atenciones={historial!.atenciones} puedeCrear={!archivado} nuevaOrden={() => ir("atencion", paciente.id)} />
        : null}
    </div>

    {archivar && <ArchivarModal paciente={paciente} cerrar={() => setArchivar(false)} listo={() => { setArchivar(false); recargar(); }} />}
  </div>;
}

// ---------- Resumen ----------

function TarjetaContacto({ paciente }: { paciente: Paciente }) {
  return <section className="card contact-card"><div className="card-header"><h2>Datos de contacto</h2></div><dl>
    <dt>Teléfono</dt><dd><b>{formatoTelefono(paciente.telefono)}</b></dd>
    <dt>Correo electrónico</dt><dd>{paciente.correo || "—"}</dd>
    <dt>Dirección</dt><dd>{paciente.direccion || "—"}</dd>
    <dt>Fecha de nacimiento</dt><dd>{fechaCorta(paciente.fecha_nacimiento)}</dd>
  </dl></section>;
}

function ResumenClinico({ paciente, historial, verConsultas }: { paciente: Paciente; historial: HistorialT | null; verConsultas: () => void }) {
  if (!historial) return <div className="history-grid"><div className="history-main"><section className="card"><Restricted texto="El resumen clínico solo lo puede consultar el personal médico. Tú puedes ver los datos de contacto y archivar el expediente." /></section></div><aside className="history-side"><TarjetaContacto paciente={paciente} /></aside></div>;

  const { atenciones, antecedentes } = historial;
  const condiciones = [...new Set(atenciones.flatMap((a) => a.diagnosticos.filter((d) => d.tipo === "definitivo").map((d) => d.nombre)))].slice(0, 4);
  const ultimaReceta = atenciones.find((a) => a.receta)?.receta;
  const alergias = antecedentes.filter((a) => a.tipo.toLowerCase().includes("alerg"));
  const otros = antecedentes.filter((a) => !a.tipo.toLowerCase().includes("alerg")).slice(0, 3);

  return <div className="history-grid">
    <div className="history-main">
      <section className="card clinical-summary"><div className="card-header"><div><h2>Resumen clínico</h2><span>Calculado a partir de las consultas registradas</span></div></div><div className="summary-grid">
        <div><small>CONDICIONES (DIAGNÓSTICOS DEFINITIVOS)</small><p>{condiciones.length ? condiciones.map((c) => <span key={c}>{c}</span>) : <em>Sin diagnósticos definitivos</em>}</p></div>
        <div><small>MEDICACIÓN DE LA ÚLTIMA RECETA</small><p>{ultimaReceta ? ultimaReceta.medicamentos.map((m) => <span className="med-line" key={m.id_medicamento}><b>{m.nombre}</b><em>{[m.dosis, m.frecuencia].filter(Boolean).join(" · ")}</em></span>) : <em>Sin recetas</em>}</p></div>
        <div><small>ALERGIAS</small><p>{alergias.length ? alergias.map((a) => <span className="danger-pill" key={a.id}>{a.descripcion || a.tipo}</span>) : <em>Ninguna registrada</em>}</p></div>
        <div><small>ANTECEDENTES</small><p>{otros.length ? otros.map((a) => <span className="med-line" key={a.id}><b>{a.tipo}</b><em>{a.descripcion}</em></span>) : <em>Ninguno registrado</em>}</p></div>
      </div></section>
      <section className="card timeline-card"><div className="card-header"><div><h2>Consultas recientes</h2><span>{atenciones.length} consultas registradas</span></div>{atenciones.length > 0 && <button className="link-btn" onClick={verConsultas}>Ver todas <Icon name="chevron" /></button>}</div>
        {atenciones.length === 0 ? <EmptyState title="Aún no hay consultas" description="Cuando se registre una consulta aparecerá aquí." /> : atenciones.slice(0, 3).map((a) => <ItemConsulta key={a.id} a={a} />)}
      </section>
    </div>
    <aside className="history-side"><TarjetaContacto paciente={paciente} /></aside>
  </div>;
}

function ResumenLaboratorio({ paciente, historial, irOrdenes }: { paciente: Paciente; historial: HistorialT | null; irOrdenes: () => void }) {
  const ordenes = historial?.atenciones ?? [];
  const examenes = ordenes.flatMap((o) => o.extra.examenes ?? []);
  const validados = examenes.filter((e: { estado: string }) => e.estado === "validado").length;
  const ultima = ordenes[0];
  return <div className="lab-overview">
    <section className="card"><div className="card-header"><div><h2>Resumen de laboratorio</h2><span>Actividad del paciente</span></div></div>
      {historial ? <div className="dental-summary-grid">
        <div><span>ÓRDENES REGISTRADAS</span><strong>{ordenes.length}</strong><small>{ordenes.filter((o) => o.extra.estado === "completada").length} completadas</small></div>
        <div><span>ÚLTIMA ORDEN</span><strong>{ultima ? fechaCorta(ultima.fecha) : "—"}</strong><small>{ultima ? ultima.extra.examenes.map((e: { tipo_examen: string }) => e.tipo_examen).join(" · ") : "Sin órdenes"}</small></div>
        <div><span>RESULTADOS VALIDADOS</span><strong>{validados}</strong><small>{examenes.length - validados} exámenes pendientes</small></div>
        <div><span>ENTREGA DE RESULTADOS</span><strong>{paciente.correo ? "Correo electrónico" : "En ventanilla"}</strong><small>{paciente.correo || "Sin correo registrado"}</small></div>
      </div> : <Restricted texto="Los resultados solo los puede consultar el laboratorista." />}
      {historial && <div className="overview-action"><Button icon="file" onClick={irOrdenes}>Ver órdenes y resultados</Button></div>}
    </section>
    <aside className="history-side"><TarjetaContacto paciente={paciente} /></aside>
  </div>;
}

// ---------- Consultas, diagnósticos y recetas ----------

function ItemConsulta({ a }: { a: Atencion }) {
  const [anio, mes, dia] = a.fecha.slice(0, 10).split("-");
  return <div className="timeline-item"><div className="timeline-date"><strong>{dia}</strong><span>{fechaCorta(`${anio}-${mes}-${dia}`).slice(3).toUpperCase()}</span></div><i /><div>
    <span className="consultation-type">{a.extra.especialidad || "Consulta"}{a.extra.hora && ` · ${String(a.extra.hora).slice(0, 5)}`}</span>
    <h3>{a.motivo}</h3>
    {a.notas && <p>{a.notas}</p>}
    {a.diagnosticos.length > 0 && <div className="chip-row">{a.diagnosticos.map((d) => <span className={`dx-chip ${d.tipo}`} key={d.id}>{d.codigo && <b>{d.codigo}</b>}{d.nombre}</span>)}</div>}
    <small>{a.profesional}{a.receta && ` · Receta ${a.receta.codigo}`}</small>
  </div></div>;
}

function Consultas({ atenciones }: { atenciones: Atencion[] }) {
  return <section className="card timeline-card"><div className="card-header"><div><h2>Consultas</h2><span>Todas las atenciones, de la más reciente a la más antigua</span></div></div>
    {atenciones.length === 0 ? <EmptyState title="Este paciente aún no tiene consultas" description="Cuando se registre una consulta aparecerá aquí." /> : atenciones.map((a) => <ItemConsulta key={a.id} a={a} />)}
  </section>;
}

function Diagnosticos({ atenciones }: { atenciones: Atencion[] }) {
  const filas = atenciones.flatMap((a) => a.diagnosticos.map((d) => ({ ...d, profesional: a.profesional, fechaConsulta: a.fecha })));
  return <section className="card table-card"><div className="card-header"><div><h2>Diagnósticos y tratamientos</h2><span>{filas.length} diagnósticos registrados</span></div></div>
    {filas.length === 0 ? <EmptyState title="Sin diagnósticos" description="Los diagnósticos se registran al guardar una consulta." /> :
      <div className="table-scroll"><table className="plain-table"><thead><tr><th>DIAGNÓSTICO</th><th>TIPO</th><th>FECHA</th><th>TRATAMIENTO</th><th>MÉDICO</th></tr></thead><tbody>
        {filas.map((d) => <tr key={d.id}>
          <td><div><strong>{d.nombre}</strong><span>{d.codigo ? `CIE-10 ${d.codigo}` : "Sin código"}{d.descripcion && ` · ${d.descripcion}`}</span></div></td>
          <td><span className={`dx-chip ${d.tipo}`}>{d.tipo === "definitivo" ? "Definitivo" : "Presuntivo"}</span></td>
          <td>{fechaCorta(d.fecha)}</td>
          <td>{d.tratamientos.length ? d.tratamientos.map((t) => <div className="cell-line" key={t.id}>{t.descripcion}{t.duracion_dias ? ` · ${t.duracion_dias} días` : ""}</div>) : "—"}</td>
          <td>{d.profesional}</td>
        </tr>)}
      </tbody></table></div>}
  </section>;
}

function Recetas({ atenciones }: { atenciones: Atencion[] }) {
  const conReceta = atenciones.filter((a) => a.receta);
  if (conReceta.length === 0) return <section className="card"><EmptyState title="Sin recetas" description="Las recetas se emiten al guardar una consulta." /></section>;
  return <div className="recipe-list">{conReceta.map((a) => <section className="card recipe-card" key={a.id}>
    <div className="card-header"><div><h2>Receta {a.receta!.codigo}</h2><span>{fechaCorta(a.receta!.fecha)} · {a.profesional} · {a.motivo}</span></div><span className="med-icon">Rx</span></div>
    <div className="recipe-items">{a.receta!.medicamentos.map((m) => <div key={m.id_medicamento}><strong>{m.nombre}</strong><span>{m.presentacion}</span><p>{[m.dosis, m.frecuencia, m.via && `vía ${m.via}`, m.duracion_dias && `${m.duracion_dias} días`].filter(Boolean).join(" · ")}</p>{m.indicaciones && <small>{m.indicaciones}</small>}</div>)}</div>
  </section>)}</div>;
}

// ---------- Antecedentes ----------

const TIPOS_ANTECEDENTE = ["alergia", "enfermedad crónica", "cirugía", "antecedente familiar", "otro"];

function Antecedentes({ paciente, historial, recargar }: { paciente: Paciente; historial: HistorialT; recargar: () => void }) {
  const usuario = useUsuario();
  const aviso = useAviso();
  const [tipo, setTipo] = useState(TIPOS_ANTECEDENTE[0]);
  const [descripcion, setDescripcion] = useState("");
  const [enviando, setEnviando] = useState(false);
  const puedeAgregar = usuario.institucion === "hospital" && paciente.estado === "activo";

  const agregar = async () => {
    setEnviando(true);
    try {
      await api.post(`/hospital/pacientes/${paciente.id}/antecedentes`, { tipo, descripcion });
      aviso.ok("El antecedente se agregó al expediente.");
      setDescripcion("");
      recargar();
    } catch (err) {
      aviso.error(err);
    } finally {
      setEnviando(false);
    }
  };

  return <section className="card"><div className="card-header"><div><h2>Antecedentes médicos</h2><span>Alergias, enfermedades crónicas, cirugías y antecedentes familiares</span></div></div>
    {puedeAgregar && <div className="inline-form"><Field label="Tipo"><select value={tipo} onChange={(e) => setTipo(e.target.value)}>{TIPOS_ANTECEDENTE.map((t) => <option key={t}>{t}</option>)}</select></Field><Field label="Descripción" full><input value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder="Ej. Alergia a la penicilina" /></Field><Button icon="plus" onClick={agregar} disabled={enviando || !descripcion.trim()}>Agregar</Button></div>}
    {historial.antecedentes.length === 0 ? <EmptyState title="Sin antecedentes" description="Aún no se han registrado antecedentes para este paciente." /> :
      <div className="antecedent-list">{historial.antecedentes.map((a) => <div key={a.id} className={a.tipo.toLowerCase().includes("alerg") ? "is-allergy" : ""}><span className="antecedent-type">{a.tipo}</span><strong>{a.descripcion || "—"}</strong><small>{fechaCorta(a.fecha)}</small></div>)}</div>}
  </section>;
}

// ---------- Hospital: internamientos del paciente ----------

function InternamientosPaciente({ historial }: { historial: HistorialT | null }) {
  const { ir } = useNav();
  const lista: { id: string; fecha_ingreso: string; fecha_egreso: string | null; motivo: string; estado: string; medico: string }[] = historial?.extra?.internamientos ?? [];
  return <section className="card admission-list"><div className="card-header"><div><h2>Internamientos del paciente</h2><span>Ingresos actuales e históricos</span></div></div>
    {lista.length === 0 ? <EmptyState title="Sin internamientos" description="Este paciente no ha sido internado." /> :
      lista.map((i) => <button key={i.id} className={`patient-admission ${i.estado === "activo" ? "active" : ""}`} onClick={() => ir("internamiento", i.id)}><div><strong>{i.motivo}</strong><span>{fechaCorta(i.fecha_ingreso)}{i.fecha_egreso ? ` – ${fechaCorta(i.fecha_egreso)}` : " · en curso"} · {i.medico}</span></div><span className={`admission-status ${i.estado === "activo" ? "active" : "discharged"}`}><i />{i.estado === "activo" ? "Activo" : "Dado de alta"}</span><Icon name="chevron" /></button>)}
  </section>;
}

// ---------- Laboratorio: órdenes del paciente ----------

function OrdenesPaciente({ atenciones, puedeCrear, nuevaOrden }: { atenciones: Atencion[]; puedeCrear: boolean; nuevaOrden: () => void }) {
  const { ir } = useNav();
  return <section className="card lab-history-orders"><div className="card-header"><div><h2>Órdenes y resultados</h2><span>Historial cronológico de exámenes del paciente</span></div>{puedeCrear && <Button icon="plus" onClick={nuevaOrden}>Nueva orden</Button>}</div>
    {atenciones.length === 0 ? <EmptyState title="Sin órdenes" description="Este paciente aún no tiene órdenes de examen." /> : <>
      <div className="historical-head"><span>ORDEN / FECHA</span><span>EXÁMENES</span><span>SOLICITANTE</span><span>ESTADO</span><span>ACCIONES</span></div>
      {atenciones.map((o) => {
        const estado = ESTADO_ORDEN[o.extra.estado] ?? ESTADO_ORDEN.pendiente;
        const abierta = ["pendiente", "en_proceso"].includes(o.extra.estado);
        return <div className="historical-order" key={o.id}>
          <div><strong>{o.extra.codigo}</strong><span>{fechaCorta(o.fecha)} · {horaDe(o.fecha)}</span></div>
          <strong>{o.extra.examenes.map((e: { tipo_examen: string }) => e.tipo_examen).join(" · ")}</strong>
          <span>{o.profesional}</span>
          <span className={`lab-status ${estado.clase}`}><i />{estado.texto}</span>
          <div>{abierta && <button onClick={() => ir("resultados", o.id)}>Registrar resultados</button>}{o.extra.estado !== "cancelada" && <button onClick={() => ir("reporte", o.id)} title="Ver reporte"><Icon name="file" size={14} /></button>}</div>
        </div>;
      })}
    </>}
  </section>;
}

// ---------- Archivar ----------

const MOTIVOS = ["Traslado a otra institución", "Fallecimiento", "Inactividad prolongada", "Baja administrativa"];

function ArchivarModal({ paciente, cerrar, listo }: { paciente: Paciente; cerrar: () => void; listo: () => void }) {
  const aviso = useAviso();
  const [motivo, setMotivo] = useState(MOTIVOS[0]);
  const [observacion, setObservacion] = useState("");
  const [enviando, setEnviando] = useState(false);

  const confirmar = async () => {
    setEnviando(true);
    try {
      await api.patch(`/pacientes/${paciente.id}/archivar`, { motivo: observacion.trim() ? `${motivo}: ${observacion.trim()}` : motivo });
      aviso.ok("El historial quedó en modo de solo lectura. Sus citas u órdenes pendientes se cancelaron.", "Historial archivado");
      listo();
    } catch (err) {
      aviso.error(err);
      setEnviando(false);
    }
  };

  return <Modal titulo="Archivar historial" descripcion={`${paciente.nombres} ${paciente.apellidos}`} icono="archive" peligro cerrar={cerrar} onSubmit={confirmar}
    acciones={<><Button variant="secondary" onClick={cerrar}>Cancelar</Button><Button variant="danger" type="submit" disabled={enviando}>{enviando ? "Archivando..." : "Archivar historial"}</Button></>}>
    <Field label="Motivo de la baja *" full><select value={motivo} onChange={(e) => setMotivo(e.target.value)}>{MOTIVOS.map((m) => <option key={m}>{m}</option>)}</select></Field>
    <Field label="Observación" full><textarea rows={3} value={observacion} onChange={(e) => setObservacion(e.target.value)} placeholder="Ej. Trasladado al Hospital Regional de Occidente" maxLength={150} /></Field>
    <div className="warning-box">Podrás consultar este historial, pero ya no se podrá registrar información clínica nueva. Esta acción no se puede deshacer desde el sistema.</div>
  </Modal>;
}
