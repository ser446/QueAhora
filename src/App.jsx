import {useState,useEffect} from "react";
import {setCatalog,ST,PTS_LIBRO,PTS_RESENA} from "./data.js";
import * as auth from "./auth.js";
import * as db from "./db.js";
import Auth from "./screens/Auth.jsx";
import ProfileForm from "./screens/ProfileForm.jsx";
import Home from "./screens/Home.jsx";
import Library from "./screens/Library.jsx";
import CatalogLibrary from "./screens/CatalogLibrary.jsx";
import {isConfigured} from "./supabase.js";
import Search from "./screens/Search.jsx";
import Book from "./screens/Book.jsx";
import CatalogBook from "./screens/CatalogBook.jsx";
import Log from "./screens/Log.jsx";
import Profile from "./screens/Profile.jsx";
import AddBook from "./screens/AddBook.jsx";
import Moderation from "./screens/Moderation.jsx";

// Pantallas que requieren haber ingresado (si no, se muestra Login)
const PRIVATE=["library","log","add","edit"];

export default function App(){
 const [user,setUser]=useState(null);       // {id,email,provider} o null (invitado)
 const [profile,setProfile]=useState(null); // datos del perfil; null = cargando
 const [ready,setReady]=useState(false);
 const [recovery,setRecovery]=useState(false);
 const [scr,setScr]=useState({n:"home"});
 const [books,setBooks]=useState([]);
 const [entries,setEntries]=useState([]);
 const [toast,setToast]=useState("");
 const [q,setQ]=useState("");
 setCatalog(books);
 const say=m=>setToast(m);
 const fail=e=>say((e&&e.message)||"Ocurrió un error. Probá de nuevo.");
 const isAdmin=profile?.role==="admin";

 // Sesión
 useEffect(()=>{
  let on=true;
  auth.getUser().then(u=>{if(on){setUser(u);setReady(true)}}).catch(()=>{if(on)setReady(true)});
  const off=auth.onAuthChange((ev,u)=>{if(!on)return;if(ev==="PASSWORD_RECOVERY"){setRecovery(true);setScr({n:"login"})}setUser(u)});
  return()=>{on=false;off()};
 },[]);
 // Catálogo (visible también para invitados)
 useEffect(()=>{db.listBooks().then(setBooks).catch(fail)},[]);
 // Perfil y lecturas de la persona que ingresó
 useEffect(()=>{
  if(!user){setProfile(null);setEntries([]);return}
  let on=true;
  Promise.all([db.getProfile(user.id),db.listEntries(user.id)]).then(([p,es])=>{
   if(!on)return;setProfile(p||{});setEntries(es);
   if(!p||!p.alias)setScr({n:"edit",notice:"Completá tu perfil para seguir."});
  }).catch(e=>{if(on)fail(e)});
  return()=>{on=false};
 },[user?.id]);
 useEffect(()=>{if(!toast)return;const t=setTimeout(()=>setToast(""),2600);return()=>clearTimeout(t)},[toast]);

 const go=(n,p={})=>{
  if(n==="profile"&&!user)n="login";
  if(PRIVATE.includes(n)&&!user){setScr({n:"login",notice:"Ingresá o registrate para usar esta función."});return}
  if(n==="mod"&&!isAdmin){setScr({n:"home"});return}
  setScr({n,...p});
 };
 const logout=async()=>{try{await auth.logout()}catch(e){}setUser(null);setScr({n:"home"})};

 const read=entries.filter(e=>e.status==="Leído");
 const revs=entries.filter(e=>e.rs==="approved");
 const pend=entries.filter(e=>e.rs==="pending");
 const points=read.length*PTS_LIBRO+revs.length*PTS_RESENA;

 const add=async bookId=>{
  if(!user){setScr({n:"login",notice:"Ingresá o registrate para agregar libros a tu biblioteca."});return}
  if(entries.find(e=>e.bookId===bookId)){say("Ya está en tu biblioteca");return}
  try{const e=await db.addEntry(user.id,bookId);setEntries(es=>[...es,e]);say("Agregado a tu biblioteca")}catch(x){fail(x)}
 };
 const upd=async(id,patch)=>{
  const cur=entries.find(e=>e.id===id);
  const next=await db.saveEntry(user.id,{...cur,...patch});
  setEntries(es=>es.map(e=>e.id===id?next:e));
  return next;
 };
 const nextStatus=async e=>{const s=ST[(ST.indexOf(e.status)+1)%3];try{await upd(e.id,{status:s});say("Ahora: "+s)}catch(x){fail(x)}};
 const addBook=async b=>{try{const nb=await db.addBook(user.id,b);setBooks(bs=>[...bs,nb]);say("Libro cargado");go("book",{id:nb.id})}catch(x){fail(x)}};

 const heads={catalogBook:["Ficha del libro",""],home:["¿Qué leemos hoy?","Descubrí tu próxima historia"],library:["Mi biblioteca","Organizá tus lecturas"],search:["Buscar","Título, autor o ISBN"],book:["Ficha del libro","Conocé la historia y las opiniones"],log:["Registrar lectura","Guardá tu experiencia"],add:["Cargar un libro","Sumalo al catálogo compartido"],mod:["Moderación","Reseñas pendientes de aprobación"],edit:["Editar perfil","Tus datos personales y tu ubicación"],profile:["Mi perfil","Tu recorrido como lector"],login:["Login","Ingresá a tu cuenta"],register:["Crear usuario","Sumate a QuéAhora?"]}[scr.n]||["QuéAhora?",""];
 const tab=scr.n==="catalogBook"?(scr.from||"search"):["home","library","search","mod"].includes(scr.n)?scr.n:(scr.n==="book"||scr.n==="add")?"search":scr.n==="log"?"library":["profile","edit","login","register"].includes(scr.n)?"profile":"home";
 const tabs=[["home","⌂","Inicio"],["library","▤","Biblioteca"],["search","⌕","Buscar"],["profile",user?"◯":"→",user?"Perfil":"Login"],...(isAdmin?[["mod","✓","Moderar"]]:[])];

 if(!ready)return <div className="phone"><div className="top"><small>QuéAhora? 📚</small><h2>Cargando…</h2></div></div>;
 return <div className="phone">
  <div className="top"><small>QuéAhora? 📚</small><h2>{heads[0]}</h2><small>{heads[1]}</small></div>
  <div className="content">
   {scr.n==="home"&&<Home go={go} user={user} entries={entries} points={points} nRead={read.length} q={q} setQ={setQ}/>}
   {scr.n==="library"&&user&&(isConfigured
    ? <CatalogLibrary key={user.id} userId={user.id} go={go} filter={scr.f||"pendiente"}/>
    : <Library go={go} entries={entries} nextStatus={nextStatus} filter={scr.f||"Leyendo"}/>)}
   {scr.n==="search"&&<Search go={go} q={q} setQ={setQ}/>}
   {scr.n==="catalogBook"&&<CatalogBook key={scr.id} id={scr.id} readingFinishedOn={scr.finishedOn} inLibrary={scr.from === "library"} user={user} onLogin={()=>go("login")} onBack={()=>go(scr.from||"search",scr.from==="library"?{f:scr.libraryFilter}:{})}/>}
   {scr.n==="book"&&<Book id={scr.id} go={go} add={add} entries={entries} user={user}/>}
   {scr.n==="log"&&user&&<Log key={scr.entryId} entry={entries.find(e=>e.id===scr.entryId)} upd={upd} go={go} toast={setToast}/>}
   {scr.n==="add"&&user&&<AddBook addBook={addBook}/>}
   {scr.n==="mod"&&isAdmin&&<Moderation toast={setToast}/>}
   {scr.n==="login"&&(!user||recovery)&&<Auth key={(scr.notice||"")+recovery} recovery={recovery} notice={scr.notice} goRegister={()=>go("register")}
     onAuth={u=>{setRecovery(false);setUser(u);setScr({n:"home"})}}/>}
   {scr.n==="register"&&!user&&<ProfileForm mode="register" goLogin={()=>go("login")}
     onRegistered={u=>{if(u){setUser(u);setScr({n:"home"})}else setScr({n:"login",notice:"Te enviamos un correo para confirmar tu cuenta. Confirmala y luego ingresá."})}}/>}
   {scr.n==="edit"&&user&&(profile?<ProfileForm key={scr.notice||"edit"} mode="edit" user={user} profile={profile} notice={scr.notice}
     onSaved={p=>{setProfile(p);say("Perfil guardado");setScr({n:"profile"})}}/>:<p className="note">Cargando tu perfil…</p>)}
   {scr.n==="profile"&&user&&<Profile user={user} profile={profile} nRead={read.length} nRev={revs.length} pend={pend.length} go={go} points={points} toast={setToast} onLogout={logout}/>}
  </div>
  {toast&&<div className="toast" role="status">{toast}</div>}
  <nav className="nav">{tabs.map(([k,i,l])=><button key={k} className={tab===k?"on":""} onClick={()=>go(k)}><i>{i}</i>{l}</button>)}</nav>
 </div>;
}
