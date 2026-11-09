import { useState } from "react";
import { api } from "../../api/cliente";
import type { Internamiento, Paciente } from "../../api/tipos";
import { useNav } from "../../navegacion";
import { useUsuario } from "../../sesion";
import { Avatar, Button, Cargando, EmptyState, ErrorCaja, Field, Modal, PageTitle, Search, fechaCorta, filaClic, hoyISO, useAviso, useCarga } from "../../ui/componentes";
import SelectorPaciente from "../../ui/SelectorPaciente";

// Días entre dos fechas YYYY-MM-DD (la estancia cuenta el día de ingreso)
export const diasEstancia = (ingreso: string, egreso: string | null) => {
  const ms = new Date((egreso || hoyISO()) + "T12:00:00").getTime() - new Date(ingreso + "T12:00:00").getTime();
  const dias = Math.round(ms / 86400000) + 1;
  return dias === 1 ? "1 día" : `${dias} días`;
};

export default function Internamientos() {
  const usuario = useUsuario();
  const { ir } = useNav();
  const [conAltas, setConAltas] = useState(false);
  const [texto, setTexto] = useState("");
  const [internar, setInternar] = useState(false);
  const { datos, error, cargando, recargar } = useCarga(() => api.get<Internamiento[]>(`/hospital/internamientos?estado=${conAltas ? "todos" : "activo"}`), [conAltas]);

  const filtro = texto.trim().toLowerCase();
  const visibles = (datos ?? []).filter((i) => !filtro || `${i.paciente} ${i.medico} ${i.motivo}`.toLowerCase().includes(filtro));

  return <div>
    <PageTitle title="Internamientos" description="Pacientes ingresados en el Hospital General." actions={usuario.rol === "medico" ? <Button icon="plus" onClick={() => setInternar(true)}>Internar paciente</Button> : undefined} />
    <section className="card table-card">
      <div className="table-tools"><Search value={texto} onChange={setTexto} placeholder="Buscar paciente, médico o motivo..." /><label className="discharged-filter"><input type="checkbox" checked={conAltas} onChange={(e) => setConAltas(e.target.checked)} /> Mostrar dados de alta</label></div>
      {cargando ? <Cargando /> : error ? <div className="card-pad"><ErrorCaja error={error} reintentar={recargar} /></div> : visibles.length === 0 ? <EmptyState title={conAltas ? "Sin internamientos" : "No hay pacientes internados"} description="Los internamientos registrados aparecerán aquí." /> :
        <div className="table-scroll"><table><thead><tr><th>PACIENTE</th><th>MÉDICO RESPONSABLE</th><th>INGRESO</th><th>ESTANCIA</th><th>MOTIVO</th><th>ESTADO</th></tr></thead><tbody>
          {visibles.map((i) => <tr key={i.id} {...filaClic(() => ir("internamiento", i.id))}>
            <td><Avatar nombre={i.paciente} /><div><strong>{i.paciente}</strong><span>Internamiento HG-I-{i.id.padStart(5, "0")}</span></div></td>
            <td>{i.medico}</td>
            <td>{fechaCorta(i.fecha_ingreso)}</td>
            <td><strong>{diasEstancia(i.fecha_ingreso, i.fecha_egreso)}</strong></td>
            <td>{i.motivo}</td>
            <td><span className={`admission-status ${i.estado === "activo" ? "active" : "discharged"}`}><i />{i.estado === "activo" ? "Activo" : "Dado de alta"}</span></td>
          </tr>)}
        </tbody></table></div>}
      {!cargando && !error && <div className="pagination"><span>Mostrando {visibles.length} internamiento(s)</span></div>}
    </section>
    {internar && <InternarModal cerrar={() => setInternar(false)} listo={(i) => ir("internamiento", i.id)} />}
  </div>;
}

export function InternarModal({ paciente: pacienteFijo, cerrar, listo }: { paciente?: Paciente; cerrar: () => void; listo: (i: Internamiento) => void }) {
  const usuario = useUsuario();
  const aviso = useAviso();
  const [paciente, setPaciente] = useState<Paciente | null>(pacienteFijo ?? null);
  const [motivo, setMotivo] = useState("");
  const [enviando, setEnviando] = useState(false);

  const guardar = async () => {
    if (!paciente || !motivo.trim()) return;
    setEnviando(true);
    try {
      const internamiento = await api.post<Internamiento>("/hospital/internamientos", { id_paciente: paciente.id, motivo });
      aviso.ok(`${internamiento.paciente} quedó internado a cargo de ${internamiento.medico}.`, "Internamiento registrado");
      listo(internamiento);
    } catch (err) {
      aviso.error(err);
      setEnviando(false);
    }
  };

  return <Modal titulo="Internar paciente" descripcion={`Médico responsable: ${usuario.nombre}`} icono="heart" cerrar={cerrar} onSubmit={guardar}
    acciones={<><Button variant="secondary" onClick={cerrar}>Cancelar</Button><Button type="submit" icon="check" disabled={!paciente || !motivo.trim() || enviando}>{enviando ? "Registrando..." : "Registrar internamiento"}</Button></>}>
    <Field label="Paciente *" full>{paciente ? <div className="chosen-patient"><Avatar nombre={`${paciente.nombres} ${paciente.apellidos}`} /><div><strong>{paciente.nombres} {paciente.apellidos}</strong></div>{!pacienteFijo && <Button variant="ghost" onClick={() => setPaciente(null)}>Cambiar</Button>}</div> : <SelectorPaciente onElegir={setPaciente} />}</Field>
    <Field label="Motivo del internamiento *" full><textarea rows={3} value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Describe el motivo clínico del ingreso..." maxLength={200} /></Field>
    <p className="hint">La fecha de ingreso es la de hoy. Un paciente no puede tener dos internamientos activos.</p>
  </Modal>;
}
