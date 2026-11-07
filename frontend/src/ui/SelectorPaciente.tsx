import { useEffect, useState } from "react";
import { api } from "../api/cliente";
import type { Paciente } from "../api/tipos";
import { Avatar, Cargando, Search, edad, formatoDpi } from "./componentes";

// Busca y elige un paciente activo de la institución
export default function SelectorPaciente({ onElegir }: { onElegir: (p: Paciente) => void }) {
  const [texto, setTexto] = useState("");
  const [resultados, setResultados] = useState<Paciente[] | null>(null);

  useEffect(() => {
    const t = window.setTimeout(() => {
      api.get<Paciente[]>(`/pacientes?buscar=${encodeURIComponent(texto.trim())}`)
        .then((lista) => setResultados(lista.filter((p) => p.estado === "activo")))
        .catch(() => setResultados([]));
    }, 300);
    return () => window.clearTimeout(t);
  }, [texto]);

  return <div className="patient-selector">
    <Search value={texto} onChange={setTexto} placeholder="Buscar paciente por nombre o DPI..." />
    <div className="patient-selector-list">
      {resultados === null ? <Cargando /> : resultados.length === 0 ? <p className="hint">No hay pacientes activos que coincidan.</p> :
        resultados.slice(0, 8).map((p) => <button type="button" key={p.id} onClick={() => onElegir(p)}>
          <Avatar nombre={`${p.nombres} ${p.apellidos}`} />
          <div><strong>{p.nombres} {p.apellidos}</strong><span>{formatoDpi(p.dpi)} · {edad(p.fecha_nacimiento)}</span></div>
        </button>)}
    </div>
  </div>;
}
