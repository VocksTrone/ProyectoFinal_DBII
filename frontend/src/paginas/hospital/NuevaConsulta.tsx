import { useState } from "react";
import { api } from "../../api/cliente";
import type { Atencion, Diagnostico, ItemCatalogo, MedicamentoRecetado, Paciente } from "../../api/tipos";
import { useNav } from "../../navegacion";
import { Button, Cargando, EmptyState, ErrorCaja, Field, Icon, PageTitle, fechaCorta, hoyISO, useAviso, useCarga } from "../../ui/componentes";

type Cita = { id: string; fecha: string; hora: string; estado: string; medico: string };

const PASOS = ["Motivo y notas", "Diagnósticos", "Tratamientos", "Receta"];
const VIAS = ["oral", "intravenosa", "intramuscular", "subcutánea", "tópica", "inhalada", "sublingual"];

const nuevoDiagnostico = (): Diagnostico => ({ nombre: "", codigo: "", tipo: "presuntivo", descripcion: "", tratamientos: [] });
const nuevoMedicamento = (): MedicamentoRecetado => ({ id_medicamento: "", dosis: "", frecuencia: "", via: "oral", duracion_dias: null, indicaciones: "" });

export default function NuevaConsulta({ idPaciente }: { idPaciente: string }) {
  const { ir } = useNav();
  const aviso = useAviso();
  const [paso, setPaso] = useState(1);
  const [motivo, setMotivo] = useState("");
  const [notas, setNotas] = useState("");
  const [idCita, setIdCita] = useState("");
  const [diagnosticos, setDiagnosticos] = useState<Diagnostico[]>([nuevoDiagnostico()]);
  const [conReceta, setConReceta] = useState(false);
  const [medicamentos, setMedicamentos] = useState<MedicamentoRecetado[]>([nuevoMedicamento()]);
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [guardada, setGuardada] = useState<Atencion | null>(null);

  const { datos, error: errorCarga, cargando } = useCarga(async () => {
    const [paciente, catalogo, citas] = await Promise.all([
      api.get<Paciente>(`/pacientes/${idPaciente}`),
      api.get<ItemCatalogo[]>("/catalogos/medicamentos"),
      api.get<Cita[]>(`/hospital/citas?id_paciente=${idPaciente}`),
    ]);
    return { paciente, catalogo, citas: citas.filter((c) => c.estado === "programada") };
  }, [idPaciente]);

  if (cargando) return <Cargando />;
  if (errorCarga || !datos) return <ErrorCaja error={errorCarga} />;
  const { paciente, catalogo, citas } = datos;
  const nombre = `${paciente.nombres} ${paciente.apellidos}`;

  if (paciente.estado === "archivado") return <section className="card"><EmptyState title="Historial archivado" description="No se pueden registrar consultas a un paciente archivado." action={<Button variant="secondary" onClick={() => ir("historial", idPaciente)}>Volver al historial</Button>} /></section>;

  // ---------- Edición de listas ----------
  const cambiarDx = (i: number, cambios: Partial<Diagnostico>) => setDiagnosticos(diagnosticos.map((d, j) => (j === i ? { ...d, ...cambios } : d)));
  const cambiarTx = (i: number, k: number, cambios: Record<string, unknown>) =>
    cambiarDx(i, { tratamientos: diagnosticos[i].tratamientos.map((t, j) => (j === k ? { ...t, ...cambios } : t)) });
  const cambiarMed = (i: number, cambios: Partial<MedicamentoRecetado>) => setMedicamentos(medicamentos.map((m, j) => (j === i ? { ...m, ...cambios } : m)));

  // ---------- Validación por paso ----------
  const validarPaso = () => {
    if (paso === 1 && !motivo.trim()) return "Escribe el motivo de la consulta.";
    if (paso === 2 && diagnosticos.some((d) => !d.nombre.trim())) return "Cada diagnóstico necesita un nombre (o quítalo).";
    if (paso === 3 && diagnosticos.some((d) => d.tratamientos.some((t) => !t.descripcion.trim()))) return "Cada tratamiento necesita una descripción (o quítalo).";
    if (paso === 4 && conReceta) {
      if (medicamentos.some((m) => !m.id_medicamento)) return "Selecciona el medicamento en cada línea de la receta.";
      if (medicamentos.some((m) => !m.dosis.trim())) return "Indica la dosis de cada medicamento.";
    }
    return "";
  };

  const avanzar = () => {
    const problema = validarPaso();
    setError(problema);
    if (!problema) setPaso(paso + 1);
  };

  const guardar = async () => {
    const problema = validarPaso();
    setError(problema);
    if (problema) return;
    setGuardando(true);
    try {
      const atencion = await api.post<Atencion>(`/pacientes/${idPaciente}/atenciones`, {
        motivo,
        notas,
        diagnosticos: diagnosticos.map((d) => ({ ...d, tratamientos: d.tratamientos.map((t) => ({ ...t, duracion_dias: t.duracion_dias ? Number(t.duracion_dias) : null })) })),
        receta: conReceta ? { medicamentos: medicamentos.map((m) => ({ ...m, duracion_dias: m.duracion_dias ? Number(m.duracion_dias) : null })) } : undefined,
        extra: idCita ? { id_cita: idCita } : {},
      });
      setGuardada(atencion);
      aviso.ok(`La consulta se agregó al historial de ${nombre}.`);
    } catch (err) {
      aviso.error(err);
    } finally {
      setGuardando(false);
    }
  };

  // ---------- Resultado ----------
  if (guardada) return <section className="card success-state"><div><Icon name="check" size={35} /></div><h1>Consulta guardada</h1>
    <p>Se registró en una sola transacción: {guardada.diagnosticos.length} diagnóstico(s){guardada.receta ? ` y la receta ${guardada.receta.codigo}` : ""} en el historial de {nombre}.</p>
    <div className="success-actions"><Button variant="secondary" onClick={() => ir("inicio")}>Volver al inicio</Button><Button icon="file" onClick={() => ir("historial", idPaciente)}>Ver historial</Button></div>
  </section>;

  return <div>
    <button className="back-link" onClick={() => ir("historial", idPaciente)}><Icon name="arrow" /> Volver al historial</button>
    <PageTitle title="Nueva consulta" description={`${nombre} · Expediente HG-${paciente.id.padStart(6, "0")}`} />
    <div className="stepper">{PASOS.map((l, i) => <div className={paso > i ? "active" : ""} key={l}><span>{paso > i + 1 ? <Icon name="check" size={15} /> : i + 1}</span><b>{l}</b>{i < PASOS.length - 1 && <i />}</div>)}</div>

    <section className="card consultation-card">
      {paso === 1 && <>
        <div className="section-heading"><span>1</span><div><h2>Motivo de consulta y notas</h2><p>Información inicial de la atención.</p></div></div>
        <div className="form-grid">
          <Field label="Motivo de consulta *" full><input value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Ej. Dolor de cabeza y fiebre" maxLength={200} autoFocus /></Field>
          <Field label="Notas clínicas" full><textarea rows={6} value={notas} onChange={(e) => setNotas(e.target.value)} placeholder="Síntomas, evolución, examen físico y hallazgos relevantes..." /></Field>
          <Field label="Cita programada" full><select value={idCita} onChange={(e) => setIdCita(e.target.value)}>
            <option value="">Atención sin cita (se registra al momento)</option>
            {citas.map((c) => <option key={c.id} value={c.id}>{fechaCorta(c.fecha)} · {c.hora} · {c.medico}</option>)}
          </select></Field>
        </div>
      </>}

      {paso === 2 && <>
        <div className="section-heading"><span>2</span><div><h2>Diagnósticos</h2><p>Uno o varios diagnósticos. Puedes dejar la lista vacía si aún no hay diagnóstico.</p></div></div>
        <div className="diagnosis-box">
          {diagnosticos.map((d, i) => <div className="dx-editor" key={i}>
            <div className="dx-editor-head"><span>Diagnóstico {i + 1}</span><button type="button" onClick={() => setDiagnosticos(diagnosticos.filter((_, j) => j !== i))} title="Quitar"><Icon name="close" size={16} /></button></div>
            <div className="dx-editor-grid">
              <Field label="Nombre *"><input value={d.nombre} onChange={(e) => cambiarDx(i, { nombre: e.target.value })} placeholder="Ej. Hipertensión esencial" maxLength={150} /></Field>
              <Field label="Código CIE-10"><input value={d.codigo || ""} onChange={(e) => cambiarDx(i, { codigo: e.target.value.toUpperCase() })} placeholder="Ej. I10" maxLength={10} /></Field>
              <Field label="Tipo"><div className="segmented">{(["presuntivo", "definitivo"] as const).map((t) => <button type="button" key={t} className={d.tipo === t ? "active" : ""} onClick={() => cambiarDx(i, { tipo: t })}>{t === "presuntivo" ? "Presuntivo" : "Definitivo"}</button>)}</div></Field>
              <Field label="Descripción" full><input value={d.descripcion || ""} onChange={(e) => cambiarDx(i, { descripcion: e.target.value })} placeholder="Detalle opcional" /></Field>
            </div>
          </div>)}
          <div><Button variant="secondary" icon="plus" onClick={() => setDiagnosticos([...diagnosticos, nuevoDiagnostico()])}>Agregar diagnóstico</Button></div>
        </div>
      </>}

      {paso === 3 && <>
        <div className="section-heading"><span>3</span><div><h2>Tratamiento por diagnóstico</h2><p>Cada tratamiento queda vinculado a su diagnóstico.</p></div></div>
        {diagnosticos.length === 0 ? <p className="hint">No hay diagnósticos, así que no se registran tratamientos. Puedes continuar.</p> :
          diagnosticos.map((d, i) => <div key={i} className="tx-block">
            <div className="treatment-title">{d.codigo && <span>{d.codigo}</span>}<strong>{d.nombre}</strong><em className={`dx-chip ${d.tipo}`}>{d.tipo}</em></div>
            {d.tratamientos.map((t, k) => <div className="tx-row" key={k}>
              <Field label="Plan de tratamiento *"><input value={t.descripcion} onChange={(e) => cambiarTx(i, k, { descripcion: e.target.value })} placeholder="Ej. Reposo, dieta baja en sodio..." /></Field>
              <Field label="Días"><input type="number" min={1} value={t.duracion_dias ?? ""} onChange={(e) => cambiarTx(i, k, { duracion_dias: e.target.value })} /></Field>
              <Field label="Inicio"><input type="date" value={t.fecha_inicio || ""} onChange={(e) => cambiarTx(i, k, { fecha_inicio: e.target.value })} /></Field>
              <button type="button" className="icon-btn" title="Quitar" onClick={() => cambiarDx(i, { tratamientos: d.tratamientos.filter((_, j) => j !== k) })}><Icon name="close" size={16} /></button>
            </div>)}
            <Button variant="ghost" icon="plus" onClick={() => cambiarDx(i, { tratamientos: [...d.tratamientos, { descripcion: "", duracion_dias: null, fecha_inicio: hoyISO() }] })}>Agregar tratamiento</Button>
          </div>)}
      </>}

      {paso === 4 && <>
        <div className="section-heading"><span>4</span><div><h2>Receta médica</h2><p>Medicamentos del catálogo del hospital.</p></div></div>
        <label className="toggle-line"><input type="checkbox" checked={conReceta} onChange={(e) => setConReceta(e.target.checked)} /> Emitir receta en esta consulta</label>
        {conReceta && <>
          {medicamentos.map((m, i) => {
            const elegido = catalogo.find((c) => c.id === m.id_medicamento);
            return <div className="medicine-card" key={i}>
              <div className="medicine-head"><div className="med-icon">Rx</div><div><strong>{elegido ? `${elegido.nombre} ${elegido.concentracion ?? ""}` : "Selecciona un medicamento"}</strong><span>{elegido?.presentacion ?? "Catálogo hospitalario"}</span></div><button type="button" onClick={() => setMedicamentos(medicamentos.filter((_, j) => j !== i))}><Icon name="close" /></button></div>
              <div className="medicine-fields">
                <Field label="Medicamento *" full><select value={m.id_medicamento} onChange={(e) => cambiarMed(i, { id_medicamento: e.target.value })}><option value="">Seleccionar del catálogo</option>{catalogo.map((c) => <option key={c.id} value={c.id}>{c.nombre} {c.concentracion} · {c.presentacion}</option>)}</select></Field>
                <Field label="Dosis *"><input value={m.dosis} onChange={(e) => cambiarMed(i, { dosis: e.target.value })} placeholder="Ej. 1 tableta" /></Field>
                <Field label="Frecuencia"><input value={m.frecuencia || ""} onChange={(e) => cambiarMed(i, { frecuencia: e.target.value })} placeholder="Ej. cada 8 horas" /></Field>
                <Field label="Vía"><select value={m.via || ""} onChange={(e) => cambiarMed(i, { via: e.target.value })}>{VIAS.map((v) => <option key={v}>{v}</option>)}</select></Field>
                <Field label="Días"><input type="number" min={1} value={m.duracion_dias ?? ""} onChange={(e) => cambiarMed(i, { duracion_dias: e.target.value ? Number(e.target.value) : null })} /></Field>
                <Field label="Indicaciones" full><input value={m.indicaciones || ""} onChange={(e) => cambiarMed(i, { indicaciones: e.target.value })} placeholder="Ej. Tomar después de las comidas" /></Field>
              </div>
            </div>;
          })}
          <Button variant="secondary" icon="plus" onClick={() => setMedicamentos([...medicamentos, nuevoMedicamento()])}>Agregar medicamento</Button>
        </>}
        <div className="summary-box"><strong>Resumen antes de guardar</strong><span>Motivo: {motivo}</span><span>{diagnosticos.length} diagnóstico(s) · {diagnosticos.reduce((s, d) => s + d.tratamientos.length, 0)} tratamiento(s) · {conReceta ? `${medicamentos.length} medicamento(s)` : "sin receta"}</span><small>Todo se guarda junto: si algo falla, no se guarda nada.</small></div>
      </>}

      {error && <div className="login-error"><Icon name="alert" size={16} />{error}</div>}
      <div className="form-actions"><Button variant="secondary" disabled={paso === 1} onClick={() => { setError(""); setPaso(paso - 1); }}>Anterior</Button>
        {paso < 4 ? <Button onClick={avanzar}>Continuar</Button> : <Button icon="check" onClick={guardar} disabled={guardando}>{guardando ? "Guardando..." : "Guardar consulta"}</Button>}
      </div>
    </section>
  </div>;
}
