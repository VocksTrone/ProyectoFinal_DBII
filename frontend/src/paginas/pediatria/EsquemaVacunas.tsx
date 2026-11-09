import { useState } from "react";
import { api } from "../../api/cliente";
import type { Paciente, VacunaCatalogo } from "../../api/tipos";
import { useNav } from "../../navegacion";
import {
  Button,
  Cargando,
  EmptyState,
  ErrorCaja,
  Icon,
  PageTitle,
  edad,
  useCarga,
} from "../../ui/componentes";

export default function EsquemaVacunas() {
  const { ir } = useNav();
  const [pacienteSeleccionado, setPacienteSeleccionado] = useState("");

  const { datos, error, cargando, recargar } = useCarga(async () => {
    const [vacunas, pacientes] = await Promise.all([
      api.get<VacunaCatalogo[]>("/pediatria/vacunas"),
      api.get<Paciente[]>("/pacientes"),
    ]);
    return { vacunas, pacientes };
  }, []);

  if (cargando) return <Cargando texto="Cargando esquema de vacunación..." />;
  if (error || !datos) return <ErrorCaja error={error} reintentar={recargar} />;

  const { vacunas, pacientes } = datos;

  return (
    <div>
      <PageTitle
        title="Esquema Nacional de Vacunación Pediátrica"
        description="Catálogo oficial de biológicos administrados y control de dosis del esquema."
      />

      <section className="card" style={{ marginBottom: "1.5rem" }}>
        <div className="card-header">
          <div>
            <h2>Consultar o aplicar vacuna a un paciente</h2>
            <span>Selecciona un infante para ver su carné de vacunación o aplicar dosis</span>
          </div>
        </div>
        <div style={{ display: "flex", gap: "1rem", alignItems: "center", flexWrap: "wrap", padding: "0 0.5rem" }}>
          <select
            style={{ maxWidth: "400px", padding: "0.6rem 0.8rem", borderRadius: "8px", border: "1px solid #d1d5db" }}
            value={pacienteSeleccionado}
            onChange={(e) => setPacienteSeleccionado(e.target.value)}
          >
            <option value="">Seleccionar paciente pediátrico...</option>
            {pacientes.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombres} {p.apellidos} ({edad(p.fecha_nacimiento)})
              </option>
            ))}
          </select>
          <Button
            icon="shield"
            disabled={!pacienteSeleccionado}
            onClick={() => ir("historial", pacienteSeleccionado)}
          >
            Abrir carné del paciente
          </Button>
        </div>
      </section>

      <div className="stats-grid" style={{ marginBottom: "1.5rem" }}>
        <div className="stat-card">
          <div className="stat-icon aqua">
            <Icon name="shield" />
          </div>
          <div>
            <span>BIOLÓGICOS DEL ESQUEMA</span>
            <strong>{vacunas.length}</strong>
            <p>Vacunas registradas en MySQL</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon blue">
            <Icon name="activity" />
          </div>
          <div>
            <span>PACIENTES ACTIVOS</span>
            <strong>{pacientes.filter((p) => p.estado === "activo").length}</strong>
            <p>Infantes bajo control</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon amber">
            <Icon name="users" />
          </div>
          <div>
            <span>COBERTURA INFANTIL</span>
            <strong>100%</strong>
            <p>Esquema nacional oficial</p>
          </div>
        </div>
      </div>

      <section className="card table-card">
        <div className="card-header">
          <div>
            <h2>Biológicos y Enfermedades Prevenidas</h2>
            <span>Detalle de vacunas, dosis totales y objetivo terapéutico</span>
          </div>
        </div>

        {vacunas.length === 0 ? (
          <EmptyState
            title="Sin vacunas"
            description="No se han configurado vacunas en la base de datos."
          />
        ) : (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>VACUNA</th>
                  <th>ENFERMEDAD QUE PREVIENE</th>
                  <th>DOSIS DEL ESQUEMA</th>
                  <th>TIPO DE ESQUEMA</th>
                </tr>
              </thead>
              <tbody>
                {vacunas.map((v) => (
                  <tr key={v.id}>
                    <td>
                      <strong>{v.nombre}</strong>
                      <span style={{ display: "block", fontSize: "0.8rem", color: "#6b7280" }}>
                        Código: VAC-{String(v.id).padStart(3, "0")}
                      </span>
                    </td>
                    <td>{v.enfermedad_previene}</td>
                    <td>
                      <span className="badge">
                        {v.dosis_requeridas} {v.dosis_requeridas === 1 ? "dosis única" : "dosis totales"}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: "0.85rem", color: "#374151" }}>Esquema Nacional</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

