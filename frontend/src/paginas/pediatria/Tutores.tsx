import { useEffect, useState } from "react";
import { api } from "../../api/cliente";
import type { Tutor } from "../../api/tipos";
import { useNav } from "../../navegacion";
import {
  Avatar,
  Button,
  Cargando,
  EmptyState,
  ErrorCaja,
  Field,
  Icon,
  Modal,
  PageTitle,
  Search,
  formatoDpi,
  formatoTelefono,
  useAviso,
  useCarga,
} from "../../ui/componentes";

export default function Tutores() {
  const { ir } = useNav();
  const aviso = useAviso();
  const [texto, setTexto] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [modalNuevo, setModalNuevo] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setBusqueda(texto.trim()), 350);
    return () => window.clearTimeout(t);
  }, [texto]);

  const { datos, error, cargando, recargar } = useCarga(
    () => api.get<Tutor[]>(`/pediatria/tutores?buscar=${encodeURIComponent(busqueda)}`),
    [busqueda]
  );

  const tutores = datos ?? [];

  return (
    <div>
      <PageTitle
        title="Padres y Tutores Legales"
        description="Directorio de responsables legales vinculados a los pacientes pediátricos."
        actions={
          <Button icon="plus" onClick={() => setModalNuevo(true)}>
            Nuevo tutor
          </Button>
        }
      />

      <section className="card table-card">
        <div className="table-tools">
          <Search value={texto} onChange={setTexto} placeholder="Buscar por nombre, parentesco o DPI..." />
        </div>

        {cargando ? (
          <Cargando texto="Cargando tutores..." />
        ) : error ? (
          <div className="card-pad">
            <ErrorCaja error={error} reintentar={recargar} />
          </div>
        ) : tutores.length === 0 ? (
          <EmptyState
            title={busqueda ? "Sin resultados" : "No hay tutores registrados"}
            description={
              busqueda
                ? `No se encontraron tutores que coincidan con "${busqueda}".`
                : "Registra el primer tutor legal para vincular pacientes infantiles."
            }
            action={
              <Button icon="plus" onClick={() => setModalNuevo(true)}>
                Registrar tutor
              </Button>
            }
          />
        ) : (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>TUTOR / RESPONSABLE</th>
                  <th>PARENTESCO</th>
                  <th>DPI</th>
                  <th>TELÉFONO</th>
                  <th>DIRECCIÓN</th>
                  <th>CORREO</th>
                </tr>
              </thead>
              <tbody>
                {tutores.map((t) => (
                  <tr key={t.id}>
                    <td>
                      <Avatar nombre={`${t.nombres} ${t.apellidos}`} />
                      <div>
                        <strong>
                          {t.nombres} {t.apellidos}
                        </strong>
                        <span>ID Tutor: TUT-{String(t.id).padStart(4, "0")}</span>
                      </div>
                    </td>
                    <td>
                      <span className="badge">{t.parentesco}</span>
                    </td>
                    <td>{formatoDpi(t.dpi)}</td>
                    <td>
                      <b>{formatoTelefono(t.telefono)}</b>
                    </td>
                    <td>{t.direccion || "—"}</td>
                    <td>{t.correo || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {modalNuevo && (
        <NuevoTutorModal
          cerrar={() => setModalNuevo(false)}
          listo={() => {
            setModalNuevo(false);
            recargar();
          }}
        />
      )}
    </div>
  );
}

function NuevoTutorModal({ cerrar, listo }: { cerrar: () => void; listo: () => void }) {
  const aviso = useAviso();
  const [nombres, setNombres] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [parentesco, setParentesco] = useState("Madre");
  const [telefono, setTelefono] = useState("");
  const [dpi, setDpi] = useState("");
  const [direccion, setDireccion] = useState("");
  const [correo, setCorreo] = useState("");
  const [enviando, setEnviando] = useState(false);

  const guardar = async () => {
    if (!nombres.trim() || !apellidos.trim()) {
      aviso.error("Nombres y apellidos son obligatorios.");
      return;
    }
    if (!telefono.trim() || telefono.length < 8) {
      aviso.error("Ingresa un número telefónico válido (8 dígitos).");
      return;
    }

    setEnviando(true);
    try {
      await api.post("/pediatria/tutores", {
        nombres: nombres.trim(),
        apellidos: apellidos.trim(),
        parentesco,
        telefono: telefono.trim(),
        dpi: dpi.trim() || null,
        direccion: direccion.trim() || null,
        correo: correo.trim() || null,
      });
      aviso.ok("Tutor legal registrado exitosamente.", "Tutor creado");
      listo();
    } catch (err) {
      aviso.error(err);
      setEnviando(false);
    }
  };

  return (
    <Modal
      titulo="Registrar tutor legal o padre de familia"
      descripcion="Información de contacto del responsable legal del menor"
      icono="users"
      cerrar={cerrar}
      onSubmit={guardar}
      acciones={
        <>
          <Button variant="secondary" onClick={cerrar}>
            Cancelar
          </Button>
          <Button type="submit" disabled={enviando}>
            {enviando ? "Guardando..." : "Guardar tutor"}
          </Button>
        </>
      }
    >
      <div className="form-grid">
        <Field label="Nombres *">
          <input value={nombres} onChange={(e) => setNombres(e.target.value)} placeholder="Ej. Carlos Eduardo" />
        </Field>
        <Field label="Apellidos *">
          <input value={apellidos} onChange={(e) => setApellidos(e.target.value)} placeholder="Ej. Morales Rivera" />
        </Field>
        <Field label="Parentesco *">
          <select value={parentesco} onChange={(e) => setParentesco(e.target.value)}>
            <option value="Madre">Madre</option>
            <option value="Padre">Padre</option>
            <option value="Tutor legal">Tutor legal</option>
            <option value="Abuelo/a">Abuelo / Abuela</option>
            <option value="Tío/a">Tío / Tía</option>
          </select>
        </Field>
        <Field label="Teléfono (8 dígitos) *">
          <input
            value={telefono}
            maxLength={8}
            inputMode="numeric"
            onChange={(e) => setTelefono(e.target.value.replace(/\D/g, ""))}
            placeholder="Ej. 55112233"
          />
        </Field>
        <Field label="DPI (13 dígitos)">
          <input
            value={dpi}
            maxLength={13}
            inputMode="numeric"
            onChange={(e) => setDpi(e.target.value.replace(/\D/g, ""))}
            placeholder="13 dígitos"
          />
        </Field>
        <Field label="Correo electrónico">
          <input
            type="email"
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
            placeholder="tutor@correo.com"
          />
        </Field>
        <Field label="Dirección de residencia" full>
          <input
            value={direccion}
            onChange={(e) => setDireccion(e.target.value)}
            placeholder="Zona, municipio y departamento"
          />
        </Field>
      </div>
    </Modal>
  );
}

