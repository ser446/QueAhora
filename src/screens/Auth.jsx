import {useState} from "react";
import * as auth from "../auth.js";

const okEmail = e => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());
const TITLES = {recover: "Recuperar acceso", reset: "Nueva contraseña"};

// Pantalla de Login: usuario (correo) y contraseña, ingreso con Google, recuperar acceso y enlace a registrarse.
export default function Auth({onAuth,recovery=false,notice="",goRegister}){
 const [mode,setMode]=useState(recovery?"reset":"login"); // login | recover | reset
 const [f,setF]=useState({email:"",pw:"",pw2:""});
 const [show,setShow]=useState(false);
 const [err,setErr]=useState("");
 const [info,setInfo]=useState(notice);
 const [sent,setSent]=useState(false);
 const [busy,setBusy]=useState(false);
 const set=k=>e=>{setF({...f,[k]:e.target.value});setErr("")};
 const to=(m,msg="")=>{setMode(m);setErr("");setInfo(msg);setSent(false);setF({...f,pw:"",pw2:""})};
 const run=async fn=>{setBusy(true);setErr("");try{await fn()}catch(e){setErr(e.message||"Ocurrió un error. Probá de nuevo.")}finally{setBusy(false)}};

 const submit=ev=>{
  ev.preventDefault();
  if(busy)return;
  if(!(mode==="reset"&&recovery)&&!okEmail(f.email))return setErr("Ingresá un correo válido.");
  if(mode==="login"){
   if(!f.pw)return setErr("Ingresá tu contraseña.");
   return run(async()=>onAuth(await auth.login(f.email,f.pw)));
  }
  if(mode==="recover")return run(async()=>{await auth.requestReset(f.email);setSent(true)});
  if(f.pw.length<8)return setErr("La contraseña debe tener al menos 8 caracteres.");
  if(f.pw!==f.pw2)return setErr("Las contraseñas no coinciden.");
  return run(async()=>{const u=await auth.resetPassword(f.email,f.pw);if(u)onAuth(u);else to("login","Contraseña actualizada. Ya podés ingresar.")});
 };

 const pw=(key,label,auto)=><>
  <div className="label">{label}</div>
  <div className="pw"><input className="field" type={show?"text":"password"} autoComplete={auto} value={f[key]} onChange={set(key)} aria-label={label}/>
   <button type="button" className="link" onClick={()=>setShow(!show)}>{show?"Ocultar":"Mostrar"}</button></div>
 </>;

 return <>
  {info&&<p className="note" style={{color:"var(--teal)",fontWeight:600}} role="status">{info}</p>}
  {TITLES[mode]&&<h3 style={{margin:"4px 0 8px"}}>{TITLES[mode]}</h3>}
  {mode==="login"&&<>
   <button type="button" className="gbtn" disabled={busy} onClick={()=>run(async()=>{const u=await auth.loginWithGoogle();if(u)onAuth(u)})}><b>G</b> Continuar con Google</button>
   <div className="or">o con tu usuario</div>
  </>}
  {mode==="recover"&&sent?<>
   <p className="note">Si el correo <b>{f.email}</b> tiene una cuenta, te enviamos un enlace para crear una contraseña nueva. Revisá también la carpeta de spam.</p>
   {auth.isDemo&&<>
    <p className="note">Modo demo: no se envió ningún correo real.</p>
    <button className="btn" onClick={()=>to("reset")}>Simular que abro el enlace</button>
   </>}
  </>:<form onSubmit={submit} noValidate>
   {mode==="recover"&&<p className="note">Ingresá el correo de tu cuenta y te enviamos un enlace para recuperar el acceso.</p>}
   {!(mode==="reset"&&recovery)&&<><div className="label">{mode==="login"?"Usuario (correo electrónico)":"Correo electrónico"}</div>
    <input className="field" type="email" inputMode="email" autoComplete="email" value={f.email} onChange={set("email")} readOnly={mode==="reset"} aria-label="Usuario (correo electrónico)"/></>}
   {mode==="login"&&pw("pw","Contraseña","current-password")}
   {mode==="reset"&&<>{pw("pw","Nueva contraseña (mínimo 8 caracteres)","new-password")}{pw("pw2","Repetí la contraseña","new-password")}</>}
   {err&&<p className="err" role="alert">{err}</p>}
   <button className="btn" type="submit" disabled={busy}>{busy?"Un momento…":{login:"Ingresar",recover:"Enviarme el enlace",reset:"Guardar contraseña"}[mode]}</button>
   {mode==="login"&&<button type="button" className="link" style={{marginTop:8}} onClick={()=>to("recover")}>¿Olvidaste tu contraseña?</button>}
  </form>}
  <div style={{textAlign:"center",marginTop:14}}>
   {mode==="login"&&<><div className="note">¿No tenés usuario?</div><button className="link" onClick={goRegister}>Registrate</button></>}
   {(mode==="recover"||mode==="reset")&&!recovery&&<button className="link" onClick={()=>to("login")}>Volver a Login</button>}
  </div>
  {auth.isDemo&&<p className="note" style={{marginTop:14}}>Modo demo: las cuentas se guardan solo en este navegador y el botón de Google simula el ingreso. Para probar el rol de administrador, registrate con admin@queahora.demo.</p>}
 </>;
}
