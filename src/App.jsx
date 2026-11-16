import {useState,useEffect} from "react";
import {BOOKS,SEED,ST,bk,setCatalog} from "./data.js";
import Home from "./screens/Home.jsx";
import Library from "./screens/Library.jsx";
import Search from "./screens/Search.jsx";
import Book from "./screens/Book.jsx";
import Log from "./screens/Log.jsx";
import Profile from "./screens/Profile.jsx";
import AddBook from "./screens/AddBook.jsx";
import Moderation from "./screens/Moderation.jsx";
import EditProfile from "./screens/EditProfile.jsx";

export default function App(){
 const [scr,setScr]=useState({n:"home"});
 const [entries,setEntries]=useState(()=>{try{const s=localStorage.getItem("qa-entries2");return s?JSON.parse(s):SEED}catch(e){return SEED}});
 const [custom,setCustom]=useState(()=>{try{const s=localStorage.getItem("qa-custom");return s?JSON.parse(s):[]}catch(e){return []}});
 setCatalog([...BOOKS,...custom]);
 const [prof,setProf]=useState(()=>{const d={name:"Mi usuario",city:"Ciudad Autónoma de Buenos Aires",hood:"Belgrano"};try{const s=localStorage.getItem("qa-prof");return s?JSON.parse(s):d}catch(e){return d}});
 const [toast,setToast]=useState("");
 const [q,setQ]=useState("");
 useEffect(()=>{try{localStorage.setItem("qa-entries2",JSON.stringify(entries));localStorage.setItem("qa-custom",JSON.stringify(custom));localStorage.setItem("qa-prof",JSON.stringify(prof))}catch(e){}},[entries,custom,prof]);
 useEffect(()=>{if(!toast)return;const t=setTimeout(()=>setToast(""),2200);return()=>clearTimeout(t)},[toast]);
 const go=(n,p={})=>setScr({n,...p});
 const read=entries.filter(e=>e.status==="Leído");
 const revs=entries.filter(e=>e.rs==="approved");const pend=entries.filter(e=>e.rs==="pending");
 const points=read.length*3+revs.length*2;
 const add=(bookId)=>{const ex=entries.find(e=>e.bookId===bookId);if(ex){setToast("Ya está en tu biblioteca");return}
  setEntries([...entries,{id:Date.now(),bookId,status:"Quiero leer",formats:["Físico"],date:"",rating:0,review:"",rs:"none"}]);setToast("Agregado a tu biblioteca")};
 const upd=(id,patch)=>setEntries(entries.map(e=>e.id===id?{...e,...patch}:e));
 const addBook=b=>{const nb={...b,id:Date.now(),r:0,c:Date.now()%5};setCustom([...custom,nb]);setToast("Libro cargado");go("book",{id:nb.id})};
 const moderate=(id,ok,reason)=>{setEntries(entries.map(e=>e.id===id?{...e,rs:ok?"approved":"rejected",reason:ok?"":reason}:e));setToast(ok?"Reseña aprobada: suma 2 puntos":"Reseña rechazada")};
 const nextStatus=e=>{const s=ST[(ST.indexOf(e.status)+1)%3];upd(e.id,{status:s});setToast("Ahora: "+s)};
 const tab=["home","library","search","profile"].includes(scr.n)?scr.n:(scr.n==="book"||scr.n==="add")?"search":(scr.n==="mod"||scr.n==="edit")?"profile":scr.n==="log"?"library":"home";
 const heads={home:["¿Qué leemos hoy?","Descubrí tu próxima historia"],library:["Mi biblioteca","Organizá tus lecturas"],search:["Buscar","Título, autor o ISBN"],book:["Ficha del libro","Conocé la historia y las opiniones"],log:["Registrar lectura","Guardá tu experiencia"],add:["Cargar un libro","Sumalo al catálogo compartido"],mod:["Moderación","Reseñas pendientes de aprobación"],edit:["Editar perfil","Tu nombre y tu ubicación"],profile:["Mi perfil","Tu recorrido como lector"]}[scr.n];

 return <div className="phone">
  <div className="top"><small>QuéAhora? 📚</small><h2>{heads[0]}</h2><small>{heads[1]}</small></div>
  <div className="content">
   {scr.n==="home"&&<Home go={go} entries={entries} points={points} nRead={read.length} q={q} setQ={setQ}/>}
   {scr.n==="library"&&<Library go={go} entries={entries} nextStatus={nextStatus} filter={scr.f||"Leyendo"}/>}
   {scr.n==="search"&&<Search go={go} q={q} setQ={setQ}/>}
   {scr.n==="book"&&<Book id={scr.id} go={go} add={add} entries={entries}/>}
   {scr.n==="log"&&<Log key={scr.entryId} entry={entries.find(e=>e.id===scr.entryId)} upd={upd} go={go} toast={setToast}/>}
   {scr.n==="add"&&<AddBook addBook={addBook}/>}
   {scr.n==="mod"&&<Moderation entries={entries} moderate={moderate}/>}
   {scr.n==="edit"&&<EditProfile prof={prof} save={p=>{setProf(p);setToast("Perfil guardado");go("profile")}}/>}
   {scr.n==="profile"&&<Profile nRead={read.length} nRev={revs.length} pend={pend.length} go={go} prof={prof} points={points} toast={setToast}/>}
  </div>
  {toast&&<div className="toast" role="status">{toast}</div>}
  <nav className="nav">{[["home","⌂","Inicio"],["library","▤","Biblioteca"],["search","⌕","Buscar"],["profile","◯","Perfil"]].map(([k,i,l])=>
   <button key={k} className={tab===k?"on":""} onClick={()=>go(k)}><i>{i}</i>{l}</button>)}</nav>
 </div>;
}
