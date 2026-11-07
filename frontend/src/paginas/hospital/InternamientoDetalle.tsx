import { useState } from "react";
import { api } from "../../api/cliente";
import type { Internamiento, ItemCatalogo } from "../../api/tipos";
import { useNav } from "../../navegacion";
import { useUsuario } from "../../sesion";
import { Button, Cargando, EmptyState, ErrorCaja, Field, Icon, Modal, Restricted, fechaCorta, hoyISO, useAviso, useCarga } from "../../ui/componentes";
import { diasEstancia } from "./Internamientos";

type Ventana = "medicamento" | "dieta" | "alta" | null;

export default function InternamientoDetalle({ id }: { id: string }) {
  const usuario = useUsuario();
  const { ir } = useNav();
  const [ventana, setVentana] = useState<Ventana>(null);
  const { datos: i, error, cargando, recargar } = useCarga(() => api.get<Internamiento>(`/hospital/internamientos/${id}`), [id]);

  if (cargando && !i) return <Cargando texto="Cargando internamiento..." />;
  if (error || !i) return <ErrorCaja error={error} reintentar={recargar} />;

  const activo = i.estado === "activo";
  const esMedico = usuario.rol === "medico";
  const dietaActual = (i.dietas ?? []).filter((d) => !d.fecha_fin).pop();
  const listo = () => { setVentana(null); recargar(); };

  return <div className="admission-detail">
    <button className="back-link" onClick={() => ir("internamientos")}><Icon name="arrow" /> Volver a internamientos</button>
    <section className="card admission-detail-head">
      <div><span>INTERNAMIENTO HG-I-{i.id.padStart(5, "0")}</span><h2>{i.motivo}</h2><p>{i.paciente} · Ingreso {fechaCorta(i.fecha_ingreso)} · {i.medico}</p></div>
      <span className={`admission-status ${activo ? "active" : "discharged"}`}><i />{activo ? "Activo" : "Dado de alta"}</span>
      <Button variant="secondary" icon="users" onClick={() => ir("historial", i.id_paciente)}>Expediente</Button>
      {activo && esMedico && <Button variant="danger" onClick={() => setVentana("alta")}>Dar de alta</Button>}
    </section>

    <section className="card inpatient-section"><div className="card-header"><div><h2>Medicamentos del internamiento</h2><span>Tratamiento farmacológico durante la estancia</span></div>{activo && esMedico && <Button variant="secondary" icon="plus" onClick={() => setVentana("medicamento")}>Agregar medicamento</Button>}</div>
      {i.medicamentos === null ? <Restricted texto="Las prescripciones son información restringida para el personal médico." /> :
        (i.medicamentos ?? []).length === 0 ? <EmptyState title="Sin medicamentos" description="Aún no se han indicado medicamentos." /> :
        <div className="table-scroll"><table className="plain-table"><thead><tr><th>MEDICAMENTO</th><th>DOSIS</th><th>INICIO</th><th>FIN</th></tr></thead><tbody>
          {i.medicamentos!.map((m) => <tr key={m.id}><td><div><strong>{m.nombre}</strong><span>{m.presentacion}</span></div></td><td>{m.dosis}</td><td>{fechaCorta(m.fecha_inicio)}</td><td>{m.fecha_fin ? fechaCorta(m.fecha_fin) : <span className="ongoing-treatment">Activo</span>}</td></tr>)}
        </tbody></table></div>}
    </section>

    <section className="card inpatient-section"><div className="card-header"><div><h2>Dieta</h2><span>Dieta actual e historial</span></div>{activo && esMedico && <Button variant="secondary" icon="edit" onClick={() => setVentana("dieta")}>Asignar dieta</Button>}</div>
      <div className="current-diet"><span>DIETA ACTUAL</span><strong>{dietaActual ? dietaActual.nombre : activo ? "Sin dieta asignada" : "Finalizada"}</strong><small>{dietaActual?.observaciones || (activo ? "" : "Se cerró al momento del alta")}</small></div>
      {(i.dietas ?? []).length > 0 && <div className="table-scroll"><table className="plain-table"><thead><tr><th>TIPO</th><th>INICIO</th><th>FIN</th><th>OBSERVACIONES</th></tr></thead><tbody>
        {i.dietas!.map((d) => <tr key={d.id}><td><strong>{d.nombre}</strong></td><td>{fechaCorta(d.fecha_inicio)}</td><td>{d.fecha_fin ? fechaCorta(d.fecha_fin) : <span className="ongoing-treatment">Activa</span>}</td><td>{d.observaciones || "—"}</td></tr>)}
      </tbody></table></div>}
    </section>

    <section className="card general-admission"><div className="card-header"><h2>Datos generales</h2></div><dl>
      <div><dt>Médico responsable</dt><dd>{i.medico}</dd></div>
      <div><dt>Motivo</dt><dd>{i.motivo}</dd></div>
      <div><dt>Ingreso</dt><dd>{fechaCorta(i.fecha_ingreso)}</dd></div>
      <div><dt>Egreso</dt><dd>{i.fecha_egreso ? fechaCorta(i.fecha_egreso) : "Pendiente"}</dd></div>
      <div><dt>Días de estancia</dt><dd>{diasEstancia(i.fecha_ingreso, i.fecha_egreso)}{activo && " · en curso"}</dd></div>
    </dl></section>

    {ventana === "medicamento" && <MedicamentoModal id={i.id} cerrar={() => setVentana(null)} listo={listo} />}
    {ventana === "dieta" && <DietaModal id={i.id} cerrar={() => setVentana(null)} listo={listo} />}
    {ventana === "alta" && <AltaModal internamiento={i} cerrar={() => setVentana(null)} listo={listo} />}
  </div>;
}

function MedicamentoModal({ id, cerrar, listo }: { id: string; cerrar: () => void; listo: () => void }) {
  const aviso = useAviso();
  const { datos: catalogo } = useCarga(() => api.get<ItemCatalogo[]>("/catalogos/medicamentos"), []);
  const [medicamento, setMedicamento] = useState("");
  const [dosis, setDosis] = useState("");
  const [inicio, setInicio] = useState(hoyISO());
  const [enviando, setEnviando] = useState(false);

  const guardar = async () => {
    setEnviando(true);
    try {
      await api.post(`/hospital/internamientos/${id}/medicamentos`, { id_medicamento: medicamento, dosis, fecha_inicio: inicio });
      aviso.ok("El medicamento se agregó al internamiento.");
      listo();
    } catch (err) {
      aviso.error(err);
      setEnviando(false);
    }
  };

  return <Modal titulo="Agregar medicamento" descripcion="Medicamentos del catálogo hospitalario." icono="plus" cerrar={cerrar} onSubmit={guardar}
    acciones={<><Button variant="secondary" onClick={cerrar}>Cancelar</Button><Button type="submit" disabled={!medicamento || !dosis.trim() || enviando}>Agregar medicamento</Button></>}>
    <Field label="Medicamento *" full><select value={medicamento} onChange={(e) => setMedicamento(e.target.value)}><option value="">Seleccionar</option>{(catalogo ?? []).map((m) => <option key={m.id} value={m.id}>{m.nombre} {m.concentracion} · {m.presentacion}</option>)}</select></Field>
    <Field label="Dosis e indicaciones *" full><input value={dosis} onChange={(e) => setDosis(e.target.value)} placeholder="Ej. 1 g IV cada 24 horas" maxLength={50} /></Field>
    <Field label="Fecha de inicio *"><input type="date" value={inicio} onChange={(e) => setInicio(e.target.value)} /></Field>
  </Modal>;
}

function DietaModal({ id, cerrar, listo }: { id: string; cerrar: () => void; listo: () => void }) {
  const aviso = useAviso();
  const { datos: dietas } = useCarga(() => api.get<ItemCatalogo[]>("/catalogos/dietas"), []);
  const [tipo, setTipo] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [enviando, setEnviando] = useState(false);

  const guardar = async () => {
    setEnviando(true);
    try {
      await api.post(`/hospital/internamientos/${id}/dietas`, { id_tipo_dieta: tipo, observaciones });
      aviso.ok("La dieta quedó asignada desde hoy.");
      listo();
    } catch (err) {
      aviso.error(err);
      setEnviando(false);
    }
  };

  return <Modal titulo="Asignar dieta" descripcion="La dieta inicia hoy." icono="edit" cerrar={cerrar} onSubmit={guardar}
    acciones={<><Button variant="secondary" onClick={cerrar}>Cancelar</Button><Button type="submit" disabled={!tipo || enviando}>Guardar dieta</Button></>}>
    <Field label="Tipo de dieta *" full><select value={tipo} onChange={(e) => setTipo(e.target.value)}><option value="">Seleccionar</option>{(dietas ?? []).map((d) => <option key={d.id} value={d.id}>{d.nombre} · {d.descripcion}</option>)}</select></Field>
    <Field label="Observaciones" full><textarea rows={3} value={observaciones} onChange={(e) => setObservaciones(e.target.value)} placeholder="Indicaciones nutricionales..." /></Field>
  </Modal>;
}

function AltaModal({ internamiento, cerrar, listo }: { internamiento: Internamiento; cerrar: () => void; listo: () => void }) {
  const aviso = useAviso();
  const [enviando, setEnviando] = useState(false);
  const abiertos = (internamiento.medicamentos ?? []).filter((m) => !m.fecha_fin).length + (internamiento.dietas ?? []).filter((d) => !d.fecha_fin).length;

  const confirmar = async () => {
    setEnviando(true);
    try {
      await api.patch(`/hospital/internamientos/${internamiento.id}/alta`);
      aviso.ok("El alta quedó registrada y los tratamientos activos se cerraron.", "Paciente dado de alta");
      listo();
    } catch (err) {
      aviso.error(err);
      setEnviando(false);
    }
  };

  return <Modal titulo="Dar de alta" descripcion={internamiento.paciente} icono="logout" peligro cerrar={cerrar} onSubmit={confirmar}
    acciones={<><Button variant="secondary" onClick={cerrar}>Cancelar</Button><Button variant="danger" type="submit" disabled={enviando}>{enviando ? "Registrando..." : "Confirmar alta"}</Button></>}>
    <div className="warning-box">Se registrará el egreso con fecha de hoy y se cerrarán {abiertos} medicamento(s) y dieta(s) activos, todo en una sola transacción.</div>
  </Modal>;
}
