import { FormEvent, useState } from "react";
import { mensajeDeError } from "../api/cliente";
import type { Institucion } from "../api/tipos";
import { INSTITUCIONES } from "../instituciones";
import { useSesion } from "../sesion";
import { Button, Field, Icon, IconName } from "../ui/componentes";
import { Logo } from "./Marco";

// Usuarios de los datos de prueba
const USUARIOS_PRUEBA: { usuario: string; password: string; rol: string; institucion: Institucion }[] = [
  { usuario: "rdiaz@hospital", password: "Hospital2026!", rol: "Médico", institucion: "hospital" },
  { usuario: "lmendez@hospital", password: "Hospital2026!", rol: "Secretaria", institucion: "hospital" },
  { usuario: "acastillo@laboratorio", password: "Laboratorio2026!", rol: "Laboratorista", institucion: "laboratorio" },
  { usuario: "pramirez@laboratorio", password: "Laboratorio2026!", rol: "Secretaria", institucion: "laboratorio" },
  { usuario: "gchoc@pediatria", password: "Pediatria2026!", rol: "Médico", institucion: "pediatria" },
  { usuario: "sperez@pediatria", password: "Pediatria2026!", rol: "Secretaria", institucion: "pediatria" },
  { usuario: "cgarcia@odontologia", password: "Odontologia2026!", rol: "Odontóloga", institucion: "odontologia" },
  { usuario: "mramirez@odontologia", password: "Odontologia2026!", rol: "Secretaria", institucion: "odontologia" },
];

const DESCRIPCION: Record<Institucion, { icono: IconName; modelo: string }> = {
  hospital: { icono: "heart", modelo: "Relacional · transacciones estrictas" },
  laboratorio: { icono: "flask", modelo: "Documental · resultados dinámicos" },
  pediatria: { icono: "users", modelo: "Relacional · crecimiento y vacunas" },
  odontologia: { icono: "activity", modelo: "Documental · atención ágil" },
};

const INSTITUCIONES_ORDEN = Object.keys(INSTITUCIONES) as Institucion[];

export default function Login() {
  const { entrar } = useSesion();
  const [usuario, setUsuario] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

  // Detecta la institución por lo que va después de "@"
  const codigo = usuario.includes("@") ? usuario.split("@").pop()!.trim().toLowerCase() : "";
  const institucion = INSTITUCIONES[codigo as Institucion];

  const enviar = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setEnviando(true);
    try {
      await entrar(usuario, password);
    } catch (err) {
      setError(mensajeDeError(err));
    } finally {
      setEnviando(false);
    }
  };

  return <main className="login-page">
    <div className="login-brand-panel">
      <Logo />
      <div className="login-message">
        <span>HISTORIA CLÍNICA CONECTADA</span>
        <h1>Una atención más humana comienza con mejor información.</h1>
        <p>Cada institución guarda sus datos en su propio motor de base de datos. Al iniciar sesión, el sistema te conecta automáticamente con el de tu institución.</p>
        <div className="login-instituciones">
          {INSTITUCIONES_ORDEN.map((k) => <div className="login-inst" data-inst={k} key={k} title={DESCRIPCION[k].modelo}>
            <span className="login-inst-icono"><Icon name={DESCRIPCION[k].icono} size={13} /></span>
            <b>{INSTITUCIONES[k].nombre}</b><em>{INSTITUCIONES[k].motor}</em>
          </div>)}
        </div>
      </div>
      <small>Proyecto Final · Bases de Datos II · Universidad Rafael Landívar</small>
    </div>

    <div className="login-form-panel"><form className="login-form" onSubmit={enviar}>
      <div className="mobile-logo"><Logo /></div>
      <span className="welcome-label">BIENVENIDO</span>
      <h2>Inicia sesión en tu cuenta</h2>
      <p>Usa tu usuario institucional con el formato <b>usuario@institución</b>.</p>
      <Field label="Usuario" full><input value={usuario} onChange={(e) => setUsuario(e.target.value)} placeholder="usuario@hospital" autoComplete="username" required /></Field>
      <Field label="Contraseña" full><div className="password-wrap"><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required /><Icon name="lock" /></div></Field>
      {error && <div className="login-error"><Icon name="alert" size={16} />{error}</div>}
      <Button type="submit" disabled={enviando || !usuario || !password}>{enviando ? "Verificando..." : "Ingresar al sistema"}</Button>
      {institucion && <div className="detected" data-inst={codigo}><Icon name="shield" /><div><span>Institución detectada</span><strong>{institucion.nombre} · {institucion.motor}</strong></div><Icon name="check" /></div>}

      <div className="demo-grupos">
        <div className="demo-grupos-titulo"><span>Usuarios de prueba</span><small>Al elegir uno se completa su contraseña</small></div>
        {INSTITUCIONES_ORDEN.filter((k) => USUARIOS_PRUEBA.some((u) => u.institucion === k)).map((k) => <div className="demo-fila" data-inst={k} key={k}>
          <span className="demo-fila-inst"><i />{INSTITUCIONES[k].nombre}</span>
          <div className="demo-fila-botones">{USUARIOS_PRUEBA.filter((u) => u.institucion === k).map((u) => <button type="button" title={u.usuario} className={usuario === u.usuario ? "active" : ""} onClick={() => { setUsuario(u.usuario); setPassword(u.password); }} key={u.usuario}>{u.rol}</button>)}</div>
        </div>)}
      </div>
    </form></div>
  </main>;
}
