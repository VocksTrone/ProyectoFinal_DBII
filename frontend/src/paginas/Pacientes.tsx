import { useEffect, useState } from "react";
import { api } from "../api/cliente";
import type { Paciente } from "../api/tipos";
import { useNav } from "../navegacion";
import { Avatar, Button, Cargando, EmptyState, ErrorCaja, PageTitle, Search, edad, fechaCorta, formatoDpi, formatoTelefono, useCarga } from "../ui/componentes";

type Filtro = "todos" | "activo" | "archivado";

export default function Pacientes() {
  const { ir } = useNav();
  const [texto, setTexto] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [filtro, setFiltro] = useState<Filtro>("todos");

  // Espera a que dejen de escribir antes de buscar
  useEffect(() => {
    const t = window.setTimeout(() => setBusqueda(texto.trim()), 350);
    return () => window.clearTimeout(t);
  }, [texto]);

  const { datos, error, cargando, recargar } = useCarga(
    () => api.get<Paciente[]>(`/pacientes?buscar=${encodeURIComponent(busqueda)}`),
    [busqueda]
  );

  const pacientes = datos ?? [];
  const visibles = pacientes.filter((p) => filtro === "todos" || p.estado === filtro);
  const contar = (f: Filtro) => pacientes.filter((p) => f === "todos" || p.estado === f).length;

  return <div>
    <PageTitle title="Pacientes" description="Busca un expediente por nombre, apellido o DPI." actions={<Button icon="plus" onClick={() => ir("registro")}>Nuevo paciente</Button>} />
    <section className="card table-card">
      <div className="table-tools">
        <Search value={texto} onChange={setTexto} placeholder="Buscar por nombre o DPI..." />
        <div className="filters">{([["todos", "Todos"], ["activo", "Activos"], ["archivado", "Archivados"]] as [Filtro, string][]).map(([f, etiqueta]) => <button key={f} className={`filter ${filtro === f ? "active" : ""}`} onClick={() => setFiltro(f)}>{etiqueta} <b>{contar(f)}</b></button>)}</div>
      </div>
      {cargando ? <Cargando texto="Buscando pacientes..." /> : error ? <div className="card-pad"><ErrorCaja error={error} reintentar={recargar} /></div> : visibles.length === 0 ? <EmptyState title={busqueda ? "Sin resultados" : "Aún no hay pacientes"} description={busqueda ? `No hay pacientes que coincidan con "${busqueda}".` : "Registra el primer expediente de tu institución."} action={<Button icon="plus" onClick={() => ir("registro")}>Registrar paciente</Button>} /> :
        <div className="table-scroll"><table><thead><tr><th>PACIENTE</th><th>DPI</th><th>EDAD</th><th>TELÉFONO</th><th>ESTADO</th><th /></tr></thead><tbody>
          {visibles.map((p) => <tr key={p.id} onClick={() => ir("historial", p.id)}>
            <td><Avatar nombre={`${p.nombres} ${p.apellidos}`} /><div><strong>{p.nombres} {p.apellidos}</strong><span>Registrado: {fechaCorta(p.extra?.fecha_registro)}</span></div></td>
            <td>{formatoDpi(p.dpi)}</td>
            <td>{edad(p.fecha_nacimiento)}</td>
            <td>{formatoTelefono(p.telefono)}</td>
            <td><span className={`status ${p.estado === "archivado" ? "archivado" : ""}`}>{p.estado === "activo" ? "Activo" : "Archivado"}</span></td>
            <td><span className="row-arrow"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="m9 18 6-6-6-6" /></svg></span></td>
          </tr>)}
        </tbody></table></div>}
      {!cargando && !error && visibles.length > 0 && <div className="pagination"><span>Mostrando {visibles.length} de {pacientes.length} pacientes</span></div>}
    </section>
  </div>;
}
