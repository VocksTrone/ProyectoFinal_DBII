import { FormEvent, useState } from "react";
import { api } from "../../api/cliente";
import type { Atencion, ExamenCatalogo, Paciente } from "../../api/tipos";
import { useNav } from "../../navegacion";
import { useUsuario } from "../../sesion";
import { Avatar, Button, Cargando, ErrorCaja, Field, Icon, PageTitle, edad, formatoDpi, useAviso, useCarga } from "../../ui/componentes";
import SelectorPaciente from "../../ui/SelectorPaciente";
import { INSTITUCIONES_ORIGEN } from "./util";

export default function NuevaOrden({ idPaciente }: { idPaciente?: string }) {
  const usuario = useUsuario();
  const { ir } = useNav();
  const aviso = useAviso();
  const [paciente, setPaciente] = useState<Paciente | null>(null);
  const [seleccion, setSeleccion] = useState<string[]>([]);
  const [medico, setMedico] = useState("");
  const [origen, setOrigen] = useState(INSTITUCIONES_ORIGEN[0]);
  const [motivo, setMotivo] = useState("");
  const [notas, setNotas] = useState("");
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [creada, setCreada] = useState<Atencion | null>(null);

  const { datos, error: errorCarga, cargando } = useCarga(async () => {
    const catalogo = await api.get<ExamenCatalogo[]>("/catalogos/examenes");
    if (idPaciente) setPaciente(await api.get<Paciente>(`/pacientes/${idPaciente}`));
    return catalogo;
  }, [idPaciente]);

  if (cargando) return <Cargando />;
  if (errorCarga || !datos) return <ErrorCaja error={errorCarga} />;
  const catalogo = datos;
  const elegidos = catalogo.filter((e) => seleccion.includes(e.codigo));
  const categorias = [...new Set(catalogo.map((e) => e.categoria))];
  const alternar = (codigo: string) => setSeleccion((s) => (s.includes(codigo) ? s.filter((c) => c !== codigo) : [...s, codigo]));

  const crear = async (e: FormEvent) => {
    e.preventDefault();
    const problema = !paciente ? "Selecciona un paciente." : !medico.trim() ? "Indica el médico solicitante." : !motivo.trim() ? "Indica el motivo o diagnóstico presuntivo." : seleccion.length === 0 ? "Selecciona al menos un examen." : "";
    setError(problema);
    if (problema || !paciente) return;
    setGuardando(true);
    try {
      const orden = await api.post<Atencion>("/laboratorio/ordenes", { id_paciente: paciente.id, examenes: seleccion, medico_solicitante: medico, institucion_origen: origen, motivo, notas });
      setCreada(orden);
      aviso.ok(`Orden ${orden.extra.codigo} lista para la toma de muestras.`, "Orden creada");
    } catch (err) {
      aviso.error(err);
    } finally {
      setGuardando(false);
    }
  };

  if (creada) return <section className="card success-state"><div><Icon name="check" size={35} /></div><h1>Orden {creada.extra.codigo} registrada</h1>
    <p>{creada.extra.examenes.length} examen(es) para {paciente?.nombres} {paciente?.apellidos}. Quedan pendientes de toma de muestra y resultados.</p>
    <div className="success-actions"><Button variant="secondary" onClick={() => ir("ordenes")}>Ir a órdenes del día</Button>{usuario.rol === "medico" ? <Button icon="flask" onClick={() => ir("resultados", creada.id)}>Registrar resultados</Button> : <Button icon="plus" onClick={() => { setCreada(null); setSeleccion([]); setMotivo(""); setNotas(""); }}>Crear otra orden</Button>}</div>
  </section>;

  const volver = () => (idPaciente ? ir("historial", idPaciente) : ir("ordenes"));

  return <div>
    <button className="back-link" onClick={volver}><Icon name="arrow" /> Volver</button>
    <PageTitle title="Nueva orden de examen" description="Selecciona el paciente, la procedencia de la solicitud y los exámenes." />
    <form className="new-order-layout" onSubmit={crear}>
      <div className="order-main">
        <section className="card order-section"><div className="section-heading"><span>1</span><div><h2>Paciente</h2><p>La orden se guarda referenciando al paciente (no se embebe en su documento).</p></div></div>
          {paciente ? <div className="chosen-patient"><Avatar nombre={`${paciente.nombres} ${paciente.apellidos}`} /><div><strong>{paciente.nombres} {paciente.apellidos}</strong><span>{formatoDpi(paciente.dpi)} · {edad(paciente.fecha_nacimiento)}</span></div>{!idPaciente && <Button variant="ghost" onClick={() => setPaciente(null)}>Cambiar</Button>}</div> : <SelectorPaciente onElegir={setPaciente} />}
        </section>

        <section className="card order-section"><div className="section-heading"><span>2</span><div><h2>Datos de la solicitud</h2><p>Quién la solicita y por qué</p></div></div><div className="form-grid">
          <Field label="Médico solicitante *"><input value={medico} onChange={(e) => setMedico(e.target.value)} placeholder="Ej. Dr. Roberto Díaz" /></Field>
          <Field label="Institución de origen"><select value={origen} onChange={(e) => setOrigen(e.target.value)}>{INSTITUCIONES_ORIGEN.map((o) => <option key={o}>{o}</option>)}</select></Field>
          <Field label="Motivo / diagnóstico presuntivo *" full><input value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Ej. Chequeo anual, control de diabetes..." /></Field>
          <Field label="Notas" full><textarea rows={2} value={notas} onChange={(e) => setNotas(e.target.value)} placeholder="Indicaciones de la muestra, observaciones de recepción..." /></Field>
        </div></section>

        <section className="card order-section"><div className="section-heading"><span>3</span><div><h2>Catálogo de exámenes</h2><p>Cada examen tiene sus propios parámetros (estructura dinámica en MongoDB)</p></div></div>
          {categorias.map((cat) => <div key={cat} className="exam-category"><small>{cat.toUpperCase()}</small><div className="exam-catalog">
            {catalogo.filter((e) => e.categoria === cat).map((e) => <button type="button" className={seleccion.includes(e.codigo) ? "selected" : ""} onClick={() => alternar(e.codigo)} key={e.codigo}>
              <span className="exam-check">{seleccion.includes(e.codigo) && <Icon name="check" size={13} />}</span>
              <div><small>{e.codigo} · {e.parametros.length} parámetros</small><strong>{e.nombre}</strong><em><Icon name="clock" size={13} />{e.preparacion}</em></div>
            </button>)}
          </div></div>)}
        </section>
      </div>

      <aside className="card order-payment"><div className="card-header"><div><h2>Resumen de la orden</h2><span>{seleccion.length} examen(es) seleccionado(s)</span></div></div>
        <div className="selected-exams">{elegidos.length === 0 ? <p className="hint">Aún no has seleccionado exámenes.</p> : elegidos.map((e) => <div key={e.codigo}><span>{e.nombre}</span><strong>{e.parametros.length} parám.</strong></div>)}</div>
        {elegidos.length > 0 && <div className="prep-box"><strong>Preparación del paciente</strong>{[...new Set(elegidos.map((e) => e.preparacion))].map((p) => <span key={p}><Icon name="clock" size={12} /> {p}</span>)}</div>}
        {error && <div className="login-error"><Icon name="alert" size={16} />{error}</div>}
        <Button type="submit" icon="check" disabled={guardando}>{guardando ? "Creando..." : "Crear orden"}</Button>
      </aside>
    </form>
  </div>;
}
