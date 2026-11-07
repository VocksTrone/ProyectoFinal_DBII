import { api } from "../../api/cliente";
import type { ExamenOrden } from "../../api/tipos";
import { useNav } from "../../navegacion";
import { useUsuario } from "../../sesion";
import { Button, Cargando, ErrorCaja, Restricted, edad, fechaCorta, formatoDpi, horaDe, sexoTexto, useCarga } from "../../ui/componentes";
import { Logo } from "../Marco";
import type { OrdenCompleta } from "./Resultados";
import { fueraDeRango } from "./util";

export default function Reporte({ idOrden }: { idOrden: string }) {
  const usuario = useUsuario();
  const { ir } = useNav();
  const { datos: orden, error, cargando } = useCarga(() => api.get<OrdenCompleta>(`/laboratorio/ordenes/${idOrden}`), [idOrden]);

  if (usuario.rol !== "medico") return <section className="card"><Restricted texto="El reporte de resultados solo lo puede consultar el laboratorista." /></section>;
  if (cargando) return <Cargando />;
  if (error || !orden) return <ErrorCaja error={error} />;

  const p = orden.paciente;
  const examenes = orden.extra.examenes as ExamenOrden[];
  const validados = examenes.filter((e) => e.estado === "validado");
  const completa = orden.extra.estado === "completada";
  const firmantes = [...new Set(validados.map((e) => e.laboratorista))];
  const ultimaValidacion = validados.map((e) => e.fecha_procesamiento || "").sort().pop();

  return <div>
    <div className="report-actions"><Button variant="secondary" icon="arrow" onClick={() => ir("ordenes")}>Volver</Button><div className="heading-actions">{!completa && <Button variant="secondary" icon="flask" onClick={() => ir("resultados", orden.id)}>Registrar resultados</Button>}<Button icon="file" onClick={() => window.print()}>Imprimir / PDF</Button></div></div>
    <article className="lab-report">
      <header><Logo /><div><strong>Laboratorio Clínico</strong><span>Red de Instituciones Médicas · Quetzaltenango</span><span>Informe generado el {fechaCorta(new Date().toISOString())}</span></div></header>
      <div className="report-title"><div><span>INFORME DE RESULTADOS</span><strong>Orden {orden.extra.codigo}</strong></div><em className={completa ? "" : "report-partial"}>{completa ? "VALIDADO" : "PARCIAL"}</em></div>
      <section className="report-patient">
        <div><span>PACIENTE</span><strong>{p ? `${p.nombres} ${p.apellidos}` : "—"}</strong></div>
        <div><span>DPI</span><strong>{formatoDpi(p?.dpi)}</strong></div>
        <div><span>EDAD / SEXO</span><strong>{p ? `${edad(p.fecha_nacimiento)} · ${sexoTexto(p.sexo)}` : "—"}</strong></div>
        <div><span>FECHA DE INGRESO</span><strong>{fechaCorta(orden.fecha)} · {horaDe(orden.fecha)}</strong></div>
        <div><span>SOLICITANTE</span><strong>{orden.profesional}</strong></div>
        <div><span>FECHA DE VALIDACIÓN</span><strong>{ultimaValidacion ? `${fechaCorta(ultimaValidacion)} · ${horaDe(ultimaValidacion)}` : "Pendiente"}</strong></div>
      </section>
      {examenes.map((e) => <section className="report-exam" key={e.id}>
        <h2>{e.tipo_examen} {e.estado !== "validado" && <small className="pending-note">· resultado pendiente</small>}</h2>
        <div className="report-result-head"><span>PARÁMETRO</span><span>RESULTADO</span><span>UNIDAD</span><span>RANGO DE REFERENCIA</span></div>
        {(e.parametros ?? []).map((par) => {
          const valor = e.valores?.[par.nombre];
          return <div className={fueraDeRango(valor, par.rango_referencia) ? "abnormal" : ""} key={par.nombre}><strong>{par.nombre}</strong><b>{valor ?? "—"}</b><span>{par.unidad || "—"}</span><span>{par.rango_referencia}</span></div>;
        })}
        {e.observaciones && <p className="report-note">Observación: {e.observaciones}</p>}
      </section>)}
      <footer><div><strong>Observaciones</strong><p>Correlacionar los resultados con el cuadro clínico del paciente. Los valores fuera del rango de referencia aparecen resaltados.</p></div><div className="signature"><span>{completa ? "Resultados validados" : "Validación parcial"}</span><strong>{firmantes.join(", ") || "—"}</strong><small>Laboratorista responsable</small></div></footer>
      <small className="report-disclaimer">Informe generado electrónicamente a partir de la orden almacenada en MongoDB.</small>
    </article>
  </div>;
}
