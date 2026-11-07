import { useEffect, useState } from "react";
import { api, ApiError } from "../../api/cliente";
import type { Atencion, ExamenOrden, Paciente } from "../../api/tipos";
import { useNav } from "../../navegacion";
import { useUsuario } from "../../sesion";
import { Button, Cargando, ErrorCaja, Field, Icon, PageTitle, Restricted, fechaCorta, horaDe, useAviso, useCarga } from "../../ui/componentes";
import { ESTADO_ORDEN, aValor, fueraDeRango } from "./util";

export type OrdenCompleta = Atencion & { paciente: Paciente | null };

export default function Resultados({ idOrden }: { idOrden: string }) {
  const usuario = useUsuario();
  const { ir } = useNav();
  const aviso = useAviso();
  const [activo, setActivo] = useState<string>("");
  const [valores, setValores] = useState<Record<string, string>>({});
  const [observaciones, setObservaciones] = useState("");
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [guardando, setGuardando] = useState(false);

  const { datos: orden, error, cargando, recargar } = useCarga(() => api.get<OrdenCompleta>(`/laboratorio/ordenes/${idOrden}`), [idOrden]);
  const examenes: ExamenOrden[] = orden?.extra.examenes ?? [];
  const examen = examenes.find((e) => e.id === activo);

  // Al cargar, abre el primer examen pendiente
  useEffect(() => {
    if (!orden) return;
    const pendiente = examenes.find((e) => e.estado === "pendiente");
    setActivo((actual) => (examenes.some((e) => e.id === actual && e.estado === "pendiente") ? actual : pendiente?.id || examenes[0]?.id || ""));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orden]);

  useEffect(() => {
    setValores({});
    setObservaciones("");
    setErrores({});
  }, [activo]);

  if (usuario.rol !== "medico") return <section className="card"><Restricted texto="Solo el laboratorista puede registrar y validar resultados." /></section>;
  if (cargando && !orden) return <Cargando texto="Cargando orden..." />;
  if (error || !orden) return <ErrorCaja error={error} reintentar={recargar} />;

  const estado = ESTADO_ORDEN[orden.extra.estado];
  const abierta = ["pendiente", "en_proceso"].includes(orden.extra.estado);
  const validados = examenes.filter((e) => e.estado === "validado").length;

  const validar = async () => {
    if (!examen) return;
    const faltan = (examen.parametros ?? []).filter((p) => !(valores[p.nombre] ?? "").trim());
    if (faltan.length) {
      setErrores(Object.fromEntries(faltan.map((p) => [p.nombre, "Falta"])));
      return;
    }
    setGuardando(true);
    try {
      const cuerpo = { valores: Object.fromEntries(Object.entries(valores).map(([k, v]) => [k, aValor(v)])), observaciones };
      await api.put(`/laboratorio/ordenes/${orden.id}/examenes/${examen.id}/resultado`, cuerpo);
      aviso.ok(`${examen.tipo_examen} validado por ${usuario.nombre}.`, "Resultado validado");
      recargar();
    } catch (err) {
      if (err instanceof ApiError) setErrores(Object.fromEntries(err.details.map((d) => [(d.field || "").replace("valores.", ""), d.message])));
      aviso.error(err);
    } finally {
      setGuardando(false);
    }
  };

  return <div>
    <button className="back-link" onClick={() => ir("ordenes")}><Icon name="arrow" /> Volver a órdenes</button>
    <PageTitle eyebrow={`ORDEN ${orden.extra.codigo}`} title={orden.paciente ? `${orden.paciente.nombres} ${orden.paciente.apellidos}` : "Paciente"} description={`Ingreso ${fechaCorta(orden.fecha)} · ${horaDe(orden.fecha)} · Solicita ${orden.profesional}${orden.extra.institucion_origen ? ` (${orden.extra.institucion_origen})` : ""}`}
      actions={<>{orden.paciente && <Button variant="secondary" icon="users" onClick={() => ir("historial", orden.paciente!.id)}>Ver paciente</Button>}<Button icon="file" onClick={() => ir("reporte", orden.id)}>Ver reporte</Button></>} />

    <div className="order-progress card"><span className={`lab-status ${estado.clase}`}><i />{estado.texto}</span><div className="progress-bar"><b style={{ width: `${examenes.length ? (validados / examenes.length) * 100 : 0}%` }} /></div><strong>{validados} de {examenes.length} exámenes validados</strong>{orden.motivo && <small>Motivo: {orden.motivo}</small>}</div>

    <section className="card lab-results-form">
      <div className="exam-switch">{examenes.map((e) => <button className={activo === e.id ? "active" : ""} onClick={() => setActivo(e.id)} key={e.id}>{e.estado === "validado" && <Icon name="check" size={12} />} {e.tipo_examen}</button>)}</div>
      {examen && <>
        <div className="card-header"><div><h2>{examen.tipo_examen}</h2><span>{examen.categoria} · {examen.codigo_examen}</span></div>{examen.estado === "validado" && <span className="validated-tag"><Icon name="lock" size={13} /> Validado, no editable</span>}</div>
        <div className="parameters-head"><span>PARÁMETRO</span><span>RESULTADO</span><span>UNIDAD</span><span>RANGO DE REFERENCIA</span></div>
        <div className="parameter-list">{(examen.parametros ?? []).map((p) => {
          const valor = examen.estado === "validado" ? examen.valores?.[p.nombre] : valores[p.nombre];
          const fuera = fueraDeRango(valor as string | number | undefined, p.rango_referencia);
          return <label className={fuera ? "abnormal" : ""} key={p.nombre}>
            <strong>{p.nombre}</strong>
            {examen.estado === "validado" ? <b className="readonly-value">{String(valor ?? "—")}</b> : <input value={valores[p.nombre] ?? ""} onChange={(e) => setValores({ ...valores, [p.nombre]: e.target.value })} placeholder={p.rango_referencia} className={errores[p.nombre] ? "input-error" : ""} />}
            <span>{p.unidad || "—"}</span>
            <small>{p.rango_referencia}</small>
            {fuera && <em>Fuera de rango</em>}
            {errores[p.nombre] && <em className="param-error">{errores[p.nombre]}</em>}
          </label>;
        })}</div>
        {examen.estado === "validado" ? <div className="validation-info"><Icon name="shield" /><div><strong>Validado por {examen.laboratorista}</strong><span>{fechaCorta(examen.fecha_procesamiento)} · {horaDe(examen.fecha_procesamiento)}{examen.observaciones && ` · ${examen.observaciones}`}</span></div></div> :
          abierta ? <><div className="validation-fields"><Field label="Laboratorista responsable"><input value={usuario.nombre} disabled /></Field><Field label="Observaciones" full><textarea rows={2} value={observaciones} onChange={(e) => setObservaciones(e.target.value)} placeholder="Notas técnicas o comentarios para el médico..." /></Field></div>
            <div className="form-actions"><span className="hint">Al validar, el resultado queda firmado con tu usuario y ya no se puede modificar.</span><Button icon="check" onClick={validar} disabled={guardando}>{guardando ? "Validando..." : "Validar resultado"}</Button></div></> :
          <div className="validation-info"><Icon name="alert" /><div><strong>La orden está {estado.texto.toLowerCase()}</strong><span>Ya no se pueden registrar resultados.</span></div></div>}
      </>}
    </section>
  </div>;
}
