import {useState,useEffect} from "react";
import {bk,fmt} from "../data.js";
import {Cover} from "../ui.jsx";
import * as db from "../db.js";

export default function Book({id,go,add,entries,user}){
 const b=bk(id),mine=entries.find(e=>e.bookId===id);
 const [rv,setRv]=useState([]);
 useEffect(()=>{let on=true;db.listReviews(id,user?.id).then(r=>{if(on)setRv(r)}).catch(()=>{});return()=>{on=false}},[id,user?.id,mine?.rs,mine?.review]);
 const pub=rv.filter(r=>r.status==="approved");
 return <>
  <div className="row"><Cover b={b} style={{width:110,height:155,flex:"none"}}/><div><h3 style={{margin:0}}>{b.t}</h3><div className="muted">{b.a}</div><p style={{margin:"10px 0"}}>{b.r?"★ "+fmt(b.r)+" / 5":"Sin calificaciones"}</p><div className="muted">{b.p?b.p+" páginas · ":""}{b.g}</div><span className="chip" style={{cursor:"default"}}>{pub.length} reseñas</span></div></div>
  {mine?<button className="btn" onClick={()=>go("log",{entryId:mine.id})}>Registrar mi lectura</button>:<button className="btn" onClick={()=>add(id)}>+ Agregar a mi biblioteca</button>}
  {!user&&<p className="note">Ingresá para guardar este libro en tu biblioteca.</p>}
  <div className="section">Reseñas de lectores</div>
  {rv.length===0&&<p className="note">Todavía no hay reseñas. Sé el primero en opinar.</p>}
  {rv.map(r=><div className="review" key={r.id}><b>{r.mine?"Vos":"@"+r.alias} · {"★".repeat(r.rating)}{"☆".repeat(5-r.rating)}</b><p className="note">{r.body}</p>
   {r.status==="pending"&&<span className="chip" style={{cursor:"default"}}>En revisión · solo la ves vos</span>}
   {r.status==="rejected"&&<p className="note" style={{color:"var(--err)"}}>Rechazada: {r.reason}. Podés editarla desde Registrar lectura y volver a enviarla.</p>}</div>)}
 </>;
}
