import {useEffect,useState} from "react";
import {listCatalogLibrary} from "../db.js";
import {Cover} from "../ui.jsx";

const labels={pendiente:"Quiero leer",leyendo:"Leyendo",terminado:"Leído",abandonado:"Abandonado"};

export default function CatalogLibrary({userId,go,filter}){
 const [result,setResult]=useState(null);
 useEffect(()=>{
  let active=true;
  listCatalogLibrary(userId).then(
   entries=>{if(active)setResult({entries})},
   ()=>{if(active)setResult({error:true})},
  );
  return()=>{active=false};
 },[userId]);

 const visible=result?.entries?.filter(entry=>entry.status===filter)??[];
 return <>
  <div>{Object.entries(labels).map(([status,label])=>
   <button key={status} className={"chip"+(status===filter?" active":"")}
    aria-pressed={status===filter} onClick={()=>go("library",{f:status})}>{label}</button>
  )}</div>
  <div className="section">{labels[filter]}</div>
  {!result&&<p className="note" role="status">Cargando tu biblioteca…</p>}
  {result?.error&&<p className="note" role="alert">No pudimos cargar tu biblioteca.</p>}
  {result?.entries&&visible.length===0&&<p className="note">No hay libros en «{labels[filter]}».</p>}
  {visible.map(({id,book,format})=><button key={id} className="listbook"
   style={{width:"100%",border:0,textAlign:"left",color:"inherit",font:"inherit",cursor:"pointer"}}
   onClick={()=>go("catalogBook",{id:book.id,from:"library",libraryFilter:filter})}>
   <Cover b={book} cls="mini"/>
   <div><b>{book.t}</b>{book.a&&<div className="muted">{book.a}</div>}
   {format&&<div className="muted">Formato · {format}</div>}</div>
  </button>)}
  <button className="btn" onClick={()=>go("search")}>Buscar libros</button>
 </>;
}
