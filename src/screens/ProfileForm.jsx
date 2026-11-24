import {useState} from "react";
import * as auth from "../auth.js";
import * as db from "../db.js";

const PAISES = ["Argentina","Bolivia","Brasil","Chile","Colombia","Ecuador","España","México","Paraguay","Perú","Uruguay","Venezuela"];
const ALIAS = /^[A-Za-z0-9._-]{3,20}$/;
const okEmail = e => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());
const CAMPOS = [["nombre","Nombre"],["apellido","Apellido"],["alias","Alias"],["pais","País"],["provincia","Provincia"],["localidad","Localidad"]];

// Pantalla de datos del usuario. La misma sirve para crear la cuenta (mode="register")
// y para editar el perfil (mode="edit", con los datos del usuario ya cargados).
export default function ProfileForm({mode,user,profile,notice="",onRegistered,onSaved,goLogin}){
 const edit=mode==="edit";
 const [f,setF]=useState({nombre:"",apellido:"",alias:"",pais:"",provincia:"",localidad:"",...(profile||{})});
 const [acc,setAcc]=useState({email:"",pw:"",pw2:""});
 const [show,setShow]=useState(false);
 const [err,setErr]=useState("");
 const [busy,setBusy]=useState(false);
 const set=k=>e=>{setF({...f,[k]:e.target.value});setErr("")};
 const setA=k=>e=>{setAcc({...acc,[k]:e.target.value});setErr("")};

 const submit=async ev=>{
  ev.preventDefault();
  if(busy)return;
  const v={};CAMPOS.forEach(([k])=>{v[k]=(f[k]||"").trim()});
  for(const [k,l] of CAMPOS) if(!v[k])return setErr("Completá el campo "+l+".");
  if(!ALIAS.test(v.alias))return setErr("El alias debe tener entre 3 y 20 caracteres: letras, números, punto, guion o guion bajo.");
  if(!edit){
   if(!okEmail(acc.email))return setErr("Ingresá un correo válido.");
   if(acc.pw.length<8)return setErr("La contraseña debe tener al menos 8 caracteres.");
   if(acc.pw!==acc.pw2)return setErr("Las contraseñas no coinciden.");
  }
  setBusy(true);setErr("");
  try{
   const changed=!edit||v.alias.toLowerCase()!==(profile?.alias||"").toLowerCase();
   if(changed&&!(await db.aliasAvailable(v.alias)))throw new Error("Ese alias ya está en uso. Elegí otro.");
   if(edit)onSaved(await db.saveProfile(user.id,v));
   else onRegistered(await auth.register({email:acc.email,password:acc.pw,profile:v}));
  }catch(e){setErr(e.message||"Ocurrió un error. Probá de nuevo.");setBusy(false)}
 };

 return <form onSubmit={submit} noValidate>
  {notice&&<p className="note" style={{color:"var(--teal)",fontWeight:600}} role="status">{notice}</p>}
  {edit&&<p className="note">Cuenta: <b>{user.email}</b></p>}
  {!edit&&<p className="note">Completá tus datos para crear tu usuario. El alias es el nombre que verán otros lectores en tus reseñas.</p>}
  {CAMPOS.map(([k,l])=><div key={k}>
   <div className="label">{l}</div>
   <input className="field" value={f[k]} onChange={set(k)} aria-label={l} list={k==="pais"?"paises":undefined}
    autoComplete={{nombre:"given-name",apellido:"family-name",pais:"country-name",provincia:"address-level1",localidad:"address-level2"}[k]||"nickname"}/>
  </div>)}
  <datalist id="paises">{PAISES.map(p=><option key={p} value={p}/>)}</datalist>
  {!edit&&<>
   <div className="label">Correo electrónico (tu usuario para ingresar)</div>
   <input className="field" type="email" inputMode="email" autoComplete="email" value={acc.email} onChange={setA("email")} aria-label="Correo electrónico"/>
   <div className="label">Contraseña (mínimo 8 caracteres)</div>
   <div className="pw"><input className="field" type={show?"text":"password"} autoComplete="new-password" value={acc.pw} onChange={setA("pw")} aria-label="Contraseña"/>
    <button type="button" className="link" onClick={()=>setShow(!show)}>{show?"Ocultar":"Mostrar"}</button></div>
   <div className="label">Repetí la contraseña</div>
   <input className="field" type={show?"text":"password"} autoComplete="new-password" value={acc.pw2} onChange={setA("pw2")} aria-label="Repetí la contraseña"/>
  </>}
  {err&&<p className="err" role="alert">{err}</p>}
  <button className="btn" type="submit" disabled={busy}>{busy?"Un momento…":edit?"Guardar cambios":"Crear usuario"}</button>
  {!edit&&<div style={{textAlign:"center",marginTop:14}}><div className="note">¿Ya tenés usuario?</div><button type="button" className="link" onClick={goLogin}>Volver a Login</button></div>}
 </form>;
}
