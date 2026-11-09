import { FormEvent, useState } from "react";
import { mensajeDeError } from "../api/cliente";
import type { Institucion } from "../api/tipos";
import { INSTITUCIONES } from "../instituciones";
import { useSesion } from "../sesion";
import { Button, Field, Icon } from "../ui/componentes";
import { Logo } from "./Marco";

// Usuarios de los datos de prueba (database/postgres, database/mongodb y database/mysql)
const USUARIOS_PRUEBA = [
  { usuario: "rdiaz@hospital", password: "Hospital2026!" },
  { usuario: "lmendez@hospital", password: "Hospital2026!" },
  { usuario: "gchoc@pediatria", password: "Pediatria2026!" },
  { usuario: "sperez@pediatria", password: "Pediatria2026!" },
  { usuario: "acastillo@laboratorio", password: "Laboratorio2026!" },
  { usuario: "pramirez@laboratorio", password: "Laboratorio2026!" },
];

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
    <div className="login-brand-panel"><Logo /><div className="login-message"><span>HISTORIA CLÍNICA CONECTADA</span><h1>Una atención más humana comienza con mejor información.</h1><p>Cada institución guarda sus datos en su propio motor de base de datos. Al iniciar sesión, el sistema te conecta automáticamente con el de tu institución.</p><div className="institution-list">
      {(Object.keys(INSTITUCIONES) as Institucion[]).map((k) => <div key={k}><Icon name="shield" /><span><b>{INSTITUCIONES[k].nombre}</b><small>{INSTITUCIONES[k].motor}</small></span></div>)}
    </div></div><small>Proyecto Final · Bases de Datos II · Universidad Rafael Landívar</small></div>
    <div className="login-form-panel"><form className="login-form" onSubmit={enviar}>
      <div className="mobile-logo"><Logo /></div>
      <span className="welcome-label">BIENVENIDO</span>
      <h2>Inicia sesión en tu cuenta</h2>
      <p>Usa tu usuario institucional con el formato <b>usuario@institución</b>.</p>
      <Field label="Usuario" full><input value={usuario} onChange={(e) => setUsuario(e.target.value)} placeholder="usuario@hospital" autoComplete="username" required /></Field>
      <Field label="Contraseña" full><div className="password-wrap"><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required /><Icon name="lock" /></div></Field>
      {error && <div className="login-error"><Icon name="alert" size={16} />{error}</div>}
      <Button type="submit" disabled={enviando || !usuario || !password}>{enviando ? "Verificando..." : "Ingresar al sistema"}</Button>
      {institucion && <div className="detected"><Icon name="shield" /><div><span>Institución detectada</span><strong>{institucion.nombre} · {institucion.motor}</strong></div><Icon name="check" /></div>}
      <div className="demo-users"><span>Usuarios de prueba</span><div>{USUARIOS_PRUEBA.map((u) => <button type="button" className={usuario === u.usuario ? "active" : ""} onClick={() => { setUsuario(u.usuario); setPassword(u.password); }} key={u.usuario}>{u.usuario}</button>)}</div><small>Al elegir uno se completa su contraseña de prueba.</small></div>
    </form></div>
  </main>;
}
