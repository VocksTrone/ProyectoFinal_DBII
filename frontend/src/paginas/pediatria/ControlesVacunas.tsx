import { useState } from "react";
import { api } from "../../api/cliente";
import type { Historial, Paciente, VacunaCatalogo } from "../../api/tipos";
import { Button, EmptyState, Field, Icon, Modal, fechaCorta, hoyISO, useAviso, useCarga } from "../../ui/componentes";

// =====================================================================
// PESTAÑA: CONTROLES DE CRECIMIENTO Y DESARROLLO
// =====================================================================

type CrecimientoProps = {
  paciente: Paciente;
  historial: Historial | null;
  recargar: () => void;
  puedeRegistrar: boolean;
  nuevoControl: () => void;
};

export function CrecimientoPaciente({ paciente, historial, puedeRegistrar, nuevoControl }: CrecimientoProps) {
  const controles: Array<{
    id: string;
    fecha: string;
    peso: number;
    talla: number;
    perimetro_cefalico: number | null;
    edad_meses: number;
    observaciones: string | null;
  }> = historial?.extra?.controles_crecimiento ?? [];

  const ultimo = controles[0];

  return (
    <section className="card">
      <div className="card-header">
        <div>
          <h2>Controles de crecimiento y desarrollo</h2>
          <span>Seguimiento antropométrico del paciente infantil</span>
        </div>
        {puedeRegistrar && (
          <Button icon="plus" onClick={nuevoControl}>
            Registrar control
          </Button>
        )}
      </div>

      {controles.length > 0 && (
        <div className="dental-summary-grid" style={{ marginBottom: "1.5rem" }}>
          <div>
            <span>ÚLTIMO PESO</span>
            <strong>{ultimo.peso} kg</strong>
            <small>{ultimo.edad_meses} meses de edad</small>
          </div>
          <div>
            <span>ÚLTIMA TALLA</span>
            <strong>{ultimo.talla} cm</strong>
            <small>Fecha: {fechaCorta(ultimo.fecha)}</small>
          </div>
          <div>
            <span>P. CEFÁLICO</span>
            <strong>{ultimo.perimetro_cefalico ? `${ultimo.perimetro_cefalico} cm` : "—"}</strong>
            <small>Perímetro cefálico</small>
          </div>
          <div>
            <span>TOTAL CONTROLES</span>
            <strong>{controles.length}</strong>
            <small>Mediciones acumuladas</small>
          </div>
        </div>
      )}

      {controles.length === 0 ? (
        <EmptyState
          title="Sin controles de crecimiento"
          description="Aún no se han registrado mediciones antropométricas para este paciente."
        />
      ) : (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>FECHA</th>
                <th>EDAD</th>
                <th>PESO</th>
                <th>TALLA</th>
                <th>P. CEFÁLICO</th>
                <th>OBSERVACIONES / DESARROLLO</th>
              </tr>
            </thead>
            <tbody>
              {controles.map((c) => (
                <tr key={c.id}>
                  <td>
                    <strong>{fechaCorta(c.fecha)}</strong>
                  </td>
                  <td>
                    <span className="badge">{c.edad_meses} meses</span>
                  </td>
                  <td>
                    <b>{c.peso} kg</b>
                  </td>
                  <td>{c.talla} cm</td>
                  <td>{c.perimetro_cefalico ? `${c.perimetro_cefalico} cm` : "—"}</td>
                  <td>{c.observaciones || "Desarrollo psicomotor y ponderal adecuado"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

// Modal para registrar medición de crecimiento
export function NuevoControlModal({
  paciente,
  cerrar,
  listo,
}: {
  paciente: Paciente;
  cerrar: () => void;
  listo: () => void;
}) {
  const aviso = useAviso();
  const [peso, setPeso] = useState("");
  const [talla, setTalla] = useState("");
  const [perimetro, setPerimetro] = useState("");
  const [fecha, setFecha] = useState(hoyISO());
  const [observaciones, setObservaciones] = useState("");
  const [enviando, setEnviando] = useState(false);

  const guardar = async () => {
    if (!peso || isNaN(Number(peso)) || Number(peso) <= 0) {
      aviso.error("El peso es obligatorio y debe ser mayor a 0");
      return;
    }
    if (!talla || isNaN(Number(talla)) || Number(talla) <= 0) {
      aviso.error("La talla es obligatoria y debe ser mayor a 0");
      return;
    }

    setEnviando(true);
    try {
      await api.post(`/pediatria/pacientes/${paciente.id}/controles`, {
        peso: Number(peso),
        talla: Number(talla),
        perimetro_cefalico: perimetro ? Number(perimetro) : null,
        fecha,
        observaciones: observaciones.trim() || null,
      });
      aviso.ok("Control antropométrico registrado exitosamente.", "Control guardado");
      listo();
    } catch (err) {
      aviso.error(err);
      setEnviando(false);
    }
  };

  return (
    <Modal
      titulo="Registrar control de crecimiento"
      descripcion={`Paciente: ${paciente.nombres} ${paciente.apellidos}`}
      icono="activity"
      cerrar={cerrar}
      onSubmit={guardar}
      acciones={
        <>
          <Button variant="secondary" onClick={cerrar}>
            Cancelar
          </Button>
          <Button type="submit" disabled={enviando}>
            {enviando ? "Guardando..." : "Guardar control"}
          </Button>
        </>
      }
    >
      <div className="form-grid">
        <Field label="Fecha del control *">
          <input type="date" value={fecha} max={hoyISO()} onChange={(e) => setFecha(e.target.value)} />
        </Field>
        <Field label="Peso (kg) *">
          <input
            type="number"
            step="0.01"
            value={peso}
            onChange={(e) => setPeso(e.target.value)}
            placeholder="Ej. 7.50"
          />
        </Field>
        <Field label="Talla / Longitud (cm) *">
          <input
            type="number"
            step="0.1"
            value={talla}
            onChange={(e) => setTalla(e.target.value)}
            placeholder="Ej. 65.5"
          />
        </Field>
        <Field label="Perímetro cefálico (cm)">
          <input
            type="number"
            step="0.1"
            value={perimetro}
            onChange={(e) => setPerimetro(e.target.value)}
            placeholder="Ej. 42.0"
          />
        </Field>
        <Field label="Observaciones clínicas" full>
          <textarea
            rows={2}
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            placeholder="Comentarios sobre el estado nutricional, hitos del desarrollo motor y cognitivo..."
          />
        </Field>
      </div>
    </Modal>
  );
}

// =====================================================================
// PESTAÑA: ESQUEMA Y CARNÉ DE VACUNACIÓN
// =====================================================================

type VacunasProps = {
  paciente: Paciente;
  historial: Historial | null;
  recargar: () => void;
  puedeRegistrar: boolean;
  nuevaVacuna: () => void;
};

export function VacunasPaciente({ paciente, historial, puedeRegistrar, nuevaVacuna }: VacunasProps) {
  const vacunas: Array<{
    id: string;
    vacuna: string;
    enfermedad_previene: string;
    numero_dosis: number;
    dosis_requeridas: number;
    fecha_aplicacion: string;
    proxima_fecha: string | null;
    lote: string | null;
    profesional: string | null;
    observaciones: string | null;
  }> = historial?.extra?.vacunas ?? [];

  return (
    <section className="card">
      <div className="card-header">
        <div>
          <h2>Carné de vacunación pediátrica</h2>
          <span>Registro cronológico de inmunizaciones aplicadas y refuerzos</span>
        </div>
        {puedeRegistrar && (
          <Button icon="plus" onClick={nuevaVacuna}>
            Aplicar vacuna
          </Button>
        )}
      </div>

      {vacunas.length === 0 ? (
        <EmptyState
          title="Sin vacunas registradas"
          description="Aún no se han documentado dosis de vacunas aplicadas a este infante."
        />
      ) : (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>VACUNA</th>
                <th>DOSIS</th>
                <th>ENFERMEDAD PREVENIDA</th>
                <th>FECHA APLICACIÓN</th>
                <th>PRÓXIMA DOSIS</th>
                <th>LOTE</th>
                <th>PROFESIONAL</th>
              </tr>
            </thead>
            <tbody>
              {vacunas.map((v) => (
                <tr key={v.id}>
                  <td>
                    <strong>{v.vacuna}</strong>
                  </td>
                  <td>
                    <span className="badge">
                      Dosis {v.numero_dosis} de {v.dosis_requeridas}
                    </span>
                  </td>
                  <td>{v.enfermedad_previene}</td>
                  <td>{fechaCorta(v.fecha_aplicacion)}</td>
                  <td>{v.proxima_fecha ? fechaCorta(v.proxima_fecha) : "—"}</td>
                  <td>
                    <code>{v.lote || "N/A"}</code>
                  </td>
                  <td>{v.profesional || "Personal de enfermería/pediatra"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

// Modal para registrar aplicación de vacuna
export function NuevaVacunaModal({
  paciente,
  cerrar,
  listo,
}: {
  paciente: Paciente;
  cerrar: () => void;
  listo: () => void;
}) {
  const aviso = useAviso();
  const [idVacuna, setIdVacuna] = useState("");
  const [fechaAplicacion, setFechaAplicacion] = useState(hoyISO());
  const [proximaFecha, setProximaFecha] = useState("");
  const [lote, setLote] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [enviando, setEnviando] = useState(false);

  // Cargar catálogo de vacunas
  const { datos: catalogoVacunas, cargando } = useCarga(async () => {
    try {
      return await api.get<VacunaCatalogo[]>("/pediatria/vacunas");
    } catch {
      return [
        { id: "1", nombre: "BCG", enfermedad_previene: "Tuberculosis", dosis_requeridas: 1 },
        { id: "2", nombre: "Hepatitis B Pediátrica", enfermedad_previene: "Hepatitis B", dosis_requeridas: 1 },
        { id: "3", nombre: "Pentavalente (DPT-HB-Hib)", enfermedad_previene: "Difteria, Tétanos, Tos ferina, HB, Hib", dosis_requeridas: 3 },
        { id: "4", nombre: "Polio IPV", enfermedad_previene: "Poliomielitis intramuscular", dosis_requeridas: 2 },
        { id: "5", nombre: "Polio bOPV", enfermedad_previene: "Poliomielitis oral", dosis_requeridas: 2 },
        { id: "6", nombre: "Rotavirus", enfermedad_previene: "Diarrea por rotavirus", dosis_requeridas: 2 },
        { id: "7", nombre: "Neumococo Conjugada", enfermedad_previene: "Neumonía y meningitis", dosis_requeridas: 3 },
        { id: "8", nombre: "SPR", enfermedad_previene: "Sarampión, Paperas, Rubéola", dosis_requeridas: 2 },
        { id: "9", nombre: "DPT Refuerzo", enfermedad_previene: "Difteria, Tétanos, Tos ferina", dosis_requeridas: 2 },
        { id: "10", nombre: "Influenza Pediátrica", enfermedad_previene: "Gripe estacional", dosis_requeridas: 2 },
      ];
    }
  }, []);

  const guardar = async () => {
    if (!idVacuna) {
      aviso.error("Selecciona la vacuna a aplicar");
      return;
    }

    setEnviando(true);
    try {
      await api.post(`/pediatria/pacientes/${paciente.id}/vacunas`, {
        id_vacuna: Number(idVacuna),
        fecha_aplicacion: fechaAplicacion,
        proxima_fecha: proximaFecha || null,
        lote: lote.trim() || null,
        observaciones: observaciones.trim() || null,
      });
      aviso.ok("Dosis de vacuna registrada en el carné.", "Vacuna aplicada");
      listo();
    } catch (err) {
      aviso.error(err);
      setEnviando(false);
    }
  };

  return (
    <Modal
      titulo="Registrar aplicación de vacuna"
      descripcion={`Paciente: ${paciente.nombres} ${paciente.apellidos}`}
      icono="shield"
      cerrar={cerrar}
      onSubmit={guardar}
      acciones={
        <>
          <Button variant="secondary" onClick={cerrar}>
            Cancelar
          </Button>
          <Button type="submit" disabled={enviando || cargando}>
            {enviando ? "Guardando..." : "Registrar vacuna"}
          </Button>
        </>
      }
    >
      <div className="form-grid">
        <Field label="Vacuna a aplicar *" full>
          <select value={idVacuna} onChange={(e) => setIdVacuna(e.target.value)}>
            <option value="" disabled>
              Seleccionar vacuna del esquema
            </option>
            {(catalogoVacunas || []).map((v) => (
              <option key={v.id} value={v.id}>
                {v.nombre} — {v.enfermedad_previene} ({v.dosis_requeridas} dosis)
              </option>
            ))}
          </select>
        </Field>
        <Field label="Fecha de aplicación *">
          <input
            type="date"
            value={fechaAplicacion}
            max={hoyISO()}
            onChange={(e) => setFechaAplicacion(e.target.value)}
          />
        </Field>
        <Field label="Próxima dosis (programada)">
          <input
            type="date"
            value={proximaFecha}
            min={fechaAplicacion}
            onChange={(e) => setProximaFecha(e.target.value)}
          />
        </Field>
        <Field label="Número de lote">
          <input value={lote} onChange={(e) => setLote(e.target.value)} placeholder="Ej. VAC-2026-901" />
        </Field>
        <Field label="Observaciones o reacciones">
          <input
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            placeholder="Ej. Tolerancia adecuada, sin signos de anafilaxia"
          />
        </Field>
      </div>
    </Modal>
  );
}

