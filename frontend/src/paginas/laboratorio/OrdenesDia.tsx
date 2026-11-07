import { useState } from "react";
import { api } from "../../api/cliente";
import type { Atencion } from "../../api/tipos";
import { useNav } from "../../navegacion";
import { useUsuario } from "../../sesion";
import { Avatar, Button, Cargando, EmptyState, ErrorCaja, Icon, PageTitle, fechaCorta, horaDe, useCarga } from "../../ui/componentes";
import { ESTADO_ORDEN } from "./util";

type Orden = Atencion & { paciente: { id: string; nombre: string; dpi: string | null } | null };
type Filtro = "" | "pendiente" | "en_proceso" | "completada" | "cancelada";

const FILTROS: [Filtro, string][] = [["", "Por atender"], ["pendiente", "Pendientes"], ["en_proceso", "En proceso"], ["completada", "Completadas"], ["cancelada", "Canceladas"]];

export default function OrdenesDia() {
  const usuario = useUsuario();
  const { ir } = useNav();
  const [filtro, setFiltro] = useState<Filtro>("");
  const { datos, error, cargando, recargar } = useCarga(() => api.get<Orden[]>(`/laboratorio/ordenes${filtro ? `?estado=${filtro}` : ""}`), [filtro]);

  const ordenes = datos ?? [];
  const examenes = ordenes.flatMap((o) => o.extra.examenes);
  const porValidar = examenes.filter((e: { estado: string }) => e.estado === "pendiente").length;

  const abrir = (o: Orden) => {
    if (usuario.rol === "medico") ir(o.extra.estado === "completada" ? "reporte" : "resultados", o.id);
    else if (o.paciente) ir("historial", o.paciente.id);
  };

  return <div>
    <PageTitle eyebrow="LABORATORIO CLÍNICO · MONGODB" title="Órdenes del día" description="Lista de trabajo: recepción de muestras, procesamiento y validación." actions={<Button icon="plus" onClick={() => ir("atencion")}>Nueva orden</Button>} />
    {!filtro && !cargando && <div className="stats-grid lab-stats">
      <div className="stat-card"><div className="stat-icon aqua"><Icon name="file" /></div><div><span>ÓRDENES POR ATENDER</span><strong>{ordenes.length}</strong><p>Pendientes y en proceso</p></div></div>
      <div className="stat-card"><div className="stat-icon amber"><Icon name="clock" /></div><div><span>EN PROCESO</span><strong>{ordenes.filter((o) => o.extra.estado === "en_proceso").length}</strong><p>Con resultados parciales</p></div></div>
      <div className="stat-card"><div className="stat-icon blue"><Icon name="flask" /></div><div><span>EXÁMENES POR VALIDAR</span><strong>{porValidar}</strong><p>{usuario.rol === "medico" ? "Requieren tu validación" : "En manos del laboratorista"}</p></div></div>
    </div>}
    <section className="card lab-day-orders">
      <div className="card-header"><div className="filters">{FILTROS.map(([f, texto]) => <button key={f} className={`filter ${filtro === f ? "active" : ""}`} onClick={() => setFiltro(f)}>{texto}</button>)}</div><div className="lab-status-legend"><span><i className="received" />Pendiente</span><span><i className="processing" />En proceso</span><span><i className="validated" />Completada</span></div></div>
      {cargando ? <Cargando /> : error ? <div className="card-pad"><ErrorCaja error={error} reintentar={recargar} /></div> : ordenes.length === 0 ? <EmptyState title="No hay órdenes" description={filtro ? "No hay órdenes con este estado." : "No hay órdenes pendientes. ¡Todo al día!"} action={<Button icon="plus" onClick={() => ir("atencion")}>Crear orden</Button>} /> : <>
        <div className="lab-order-head"><span>INGRESO</span><span>ORDEN / PACIENTE</span><span>EXÁMENES</span><span>ESTADO</span><span /></div>
        {ordenes.map((o) => {
          const estado = ESTADO_ORDEN[o.extra.estado];
          const listos = o.extra.examenes.filter((e: { estado: string }) => e.estado === "validado").length;
          return <button className="lab-order-row" onClick={() => abrir(o)} key={o.id}>
            <strong>{horaDe(o.fecha)}<small className="row-date">{fechaCorta(o.fecha).slice(0, 6)}</small></strong>
            <Avatar nombre={o.paciente?.nombre || "?"} />
            <div className="lab-patient"><strong>{o.paciente?.nombre}</strong><span>{o.extra.codigo} · {o.profesional}</span></div>
            <span className="lab-tests">{o.extra.examenes.map((e: { tipo_examen: string }) => e.tipo_examen).join(" · ")}<small className="row-date">{listos}/{o.extra.examenes.length} validados</small></span>
            <span className={`lab-status ${estado.clase}`}><i />{estado.texto}</span>
            <Icon name="chevron" size={15} />
          </button>;
        })}
      </>}
    </section>
  </div>;
}
