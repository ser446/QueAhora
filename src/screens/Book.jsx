import {useState,useEffect,useMemo} from "react";
import {BOOKS,CAT,SEED_REV,ST,FM,bk,fmt} from "../data.js";
import {Cover,Stars} from "../ui.jsx";

export default function Book({id,go,add,entries}){
 const b=bk(id),mine=entries.find(e=>e.bookId===id);
 const rv=[...(SEED_REV[id]||[]),...entries.filter(e=>e.bookId===id&&e.rs!=="none").map(e=>["Vos",e.rating,e.review,e.rs,e.reason])];
 return <>
  <div className="row"><Cover b={b} style={{width:110,height:155,flex:"none"}}/><div><h3 style={{margin:0}}>{b.t}</h3><div className="muted">{b.a}</div><p style={{margin:"10px 0"}}>{b.r?"★ "+fmt(b.r)+" / 5":"Sin calificaciones"}</p><div className="muted">{b.p?b.p+" páginas · ":""}{b.g}</div><span className="chip" style={{cursor:"default"}}>{rv.filter(r=>!r[3]||r[3]==="approved").length} reseñas</span></div></div>
  {mine?<button className="btn" onClick={()=>go("log",{entryId:mine.id})}>Registrar mi lectura</button>:<button className="btn" onClick={()=>add(id)}>+ Agregar a mi biblioteca</button>}
  <div className="section">Reseñas de lectores</div>
  {rv.length===0&&<p className="note">Todavía no hay reseñas. Sé el primero en opinar.</p>}
  {rv.map((r,i)=><div className="review" key={i}><b>{r[0]} · {"★".repeat(r[1])}{"☆".repeat(5-r[1])}</b><p className="note">{r[2]}</p>{r[3]==="pending"&&<span className="chip" style={{cursor:"default"}}>En revisión · solo la ves vos</span>}{r[3]==="rejected"&&<p className="note" style={{color:"var(--coral)"}}>Rechazada: {r[4]}. Podés editarla desde Registrar lectura y volver a enviarla.</p>}</div>)}
 </>;
}
