import { FormEvent, useState } from "react";
import { api, ApiError } from "../api/cliente";
import type { Paciente } from "../api/tipos";
import { INSTITUCIONES } from "../instituciones";
import { useNav } from "../navegacion";
import { useUsuario } from "../sesion";
import { Button, Field, Icon, PageTitle, hoyISO, useAviso } from "../ui/componentes";

const TIPOS_SANGRE = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const VACIO = { nombres: "", apellidos: "", dpi: "", fecha_nacimiento: "", sexo: "", telefono: "", correo: "", direccion: "", tipo_sangre: "" };
type Formulario = typeof VACIO;

// Mismas reglas que el backend, para avisar antes de enviar
const validar = (f: Formulario) => {
  const e: Partial<Record<keyof Formulario, string>> = {};
  if (!f.nombres.trim()) e.nombres = "Es obligatorio";
  if (!f.apellidos.trim()) e.apellidos = "Es obligatorio";
  if (!f.fecha_nacimiento) e.fecha_nacimiento = "Es obligatoria";
  else if (f.fecha_nacimiento > hoyISO()) e.fecha_nacimiento = "No puede ser futura";
  if (!f.sexo) e.sexo = "Selecciona una opción";
  if (f.dpi && !/^\d{13}$/.test(f.dpi)) e.dpi = "Debe tener 13 dígitos";
  if (f.telefono && !/^\d{8}$/.test(f.telefono)) e.telefono = "Debe tener 8 dígitos";
  if (f.correo && !/^\S+@\S+\.\S+$/.test(f.correo)) e.correo = "Correo inválido";
  return e;
};

export default function RegistroPaciente() {
  const usuario = useUsuario();
  const { ir } = useNav();
  const aviso = useAviso();
  const [f, setF] = useState<Formulario>(VACIO);
  const [errores, setErrores] = useState<Partial<Record<keyof Formulario, string>>>({});
  const [enviando, setEnviando] = useState(false);
  const esHospital = usuario.institucion === "hospital";
  const esLab = usuario.institucion === "laboratorio";
  const esPediatria = usuario.institucion === "pediatria";
  const [tutorNombre, setTutorNombre] = useState("");
  const [tutorApellido, setTutorApellido] = useState("");
  const [tutorParentesco, setTutorParentesco] = useState("Madre");
  const [tutorTelefono, setTutorTelefono] = useState("");

  const campo = (nombre: keyof Formulario) => ({
    value: f[nombre],
    onChange: (e: { target: { value: string } }) => setF({ ...f, [nombre]: e.target.value }),
  });
  const numerico = (nombre: "dpi" | "telefono", max: number) => ({
    value: f[nombre],
    inputMode: "numeric" as const,
    maxLength: max,
    onChange: (e: { target: { value: string } }) => setF({ ...f, [nombre]: e.target.value.replace(/\D/g, "") }),
  });

  const enviar = async (e: FormEvent) => {
    e.preventDefault();
    const encontrados = validar(f);
    setErrores(encontrados);
    if (Object.keys(encontrados).length) return;

    setEnviando(true);
    try {
      const { tipo_sangre, ...datos } = f;
      const extra: Record<string, any> = {};
      if (tipo_sangre) extra.tipo_sangre = tipo_sangre;
      if (esPediatria && (tutorNombre.trim() || tutorApellido.trim())) {
        extra.encargado = {
          nombres: tutorNombre.trim() || "Encargado",
          apellidos: tutorApellido.trim() || "Principal",
          parentesco: tutorParentesco,
          telefono: tutorTelefono.trim() || f.telefono || "55555555",
        };
      }
      const paciente = await api.post<Paciente>("/pacientes", { ...datos, extra });
      aviso.ok(`${paciente.nombres} ${paciente.apellidos} fue registrado en ${INSTITUCIONES[usuario.institucion].nombre}.`);
      ir("historial", paciente.id);
    } catch (err) {
      // Ej. DPI duplicado
      if (err instanceof ApiError && err.status === 409) setErrores({ dpi: "Ya existe un paciente con este DPI" });
      aviso.error(err);
    } finally {
      setEnviando(false);
    }
  };

  return <div>
    <button className="back-link" onClick={() => ir("pacientes")}><Icon name="arrow" /> Volver a pacientes</button>
    <PageTitle title="Registrar nuevo paciente" description={esLab ? "Crea el registro para órdenes de examen y entrega de resultados." : "Completa la información para crear un expediente clínico."} />
    <form className="card form-card" onSubmit={enviar} noValidate>
      <div className="form-section"><div className="section-title"><span>01</span><div><h2>Datos personales</h2><p>Identificación del paciente</p></div></div><div className="form-grid">
        <Field label="Nombres *" error={errores.nombres}><input {...campo("nombres")} placeholder="Ej. María Fernanda" /></Field>
        <Field label="Apellidos *" error={errores.apellidos}><input {...campo("apellidos")} placeholder="Ej. López García" /></Field>
        <Field label="DPI" error={errores.dpi}><input {...numerico("dpi", 13)} placeholder="13 dígitos" /></Field>
        <Field label="Fecha de nacimiento *" error={errores.fecha_nacimiento}><input type="date" max={hoyISO()} {...campo("fecha_nacimiento")} /></Field>
        <Field label="Sexo *" error={errores.sexo}><select {...campo("sexo")}><option value="" disabled>Seleccionar</option><option value="F">Femenino</option><option value="M">Masculino</option></select></Field>
        {esHospital && <Field label="Tipo de sangre"><select {...campo("tipo_sangre")}><option value="">Sin dato</option>{TIPOS_SANGRE.map((t) => <option key={t}>{t}</option>)}</select></Field>}
      </div></div>
      <div className="form-section"><div className="section-title"><span>02</span><div><h2>Información de contacto</h2><p>{esLab ? "Para avisar y entregar resultados" : "Datos para comunicación y ubicación"}</p></div></div><div className="form-grid">
        <Field label="Teléfono" error={errores.telefono}><input {...numerico("telefono", 8)} placeholder="8 dígitos" /></Field>
        <Field label={esLab ? "Correo para resultados" : "Correo electrónico"} error={errores.correo}><input type="email" {...campo("correo")} placeholder="paciente@correo.com" /></Field>
        <Field label="Dirección" full><input {...campo("direccion")} placeholder="Zona, municipio y departamento" maxLength={200} /></Field>
      </div></div>
      {esPediatria && (
        <div className="form-section">
          <div className="section-title">
            <span>03</span>
            <div>
              <h2>Padre, madre o tutor legal</h2>
              <p>Vinculación requerida para el menor de edad</p>
            </div>
          </div>
          <div className="form-grid">
            <Field label="Nombres del tutor">
              <input value={tutorNombre} onChange={(e) => setTutorNombre(e.target.value)} placeholder="Ej. Carlos Eduardo" />
            </Field>
            <Field label="Apellidos del tutor">
              <input value={tutorApellido} onChange={(e) => setTutorApellido(e.target.value)} placeholder="Ej. Morales Rivera" />
            </Field>
            <Field label="Parentesco">
              <select value={tutorParentesco} onChange={(e) => setTutorParentesco(e.target.value)}>
                <option value="Madre">Madre</option>
                <option value="Padre">Padre</option>
                <option value="Tutor legal">Tutor legal</option>
                <option value="Abuelo/a">Abuelo / Abuela</option>
                <option value="Tío/a">Tío / Tía</option>
              </select>
            </Field>
            <Field label="Teléfono del tutor">
              <input
                value={tutorTelefono}
                maxLength={8}
                inputMode="numeric"
                onChange={(e) => setTutorTelefono(e.target.value.replace(/\D/g, ""))}
                placeholder="8 dígitos"
              />
            </Field>
          </div>
        </div>
      )}
      <div className="form-actions"><Button variant="secondary" onClick={() => ir("pacientes")}>Cancelar</Button><Button type="submit" icon="check" disabled={enviando}>{enviando ? "Guardando..." : "Registrar paciente"}</Button></div>
    </form>
  </div>;
}
