import {useState,useEffect,useMemo} from "react";
import {BOOKS,CAT,SEED_REV,ST,FM,bk,fmt} from "../data.js";
import {Cover,Stars} from "../ui.jsx";

export default function Moderation({entries,moderate}){
 const list=entries.filter(e=>e.rs==="pending");
 const [rej,setRej]=useState(null);const [why,setWhy]=useState("");
 const done=entries.filter(e=>e.rs==="approved"||e.rs==="rejected");
 return <>
  <p className="note">Aprobar publica la reseña y suma 2 puntos al lector. Al rechazar, el lector ve el motivo y puede corregirla.</p>
  <div className="section">Pendientes ({list.length})</div>
  {list.length===0&&<p className="note">No hay reseñas pendientes. Cuando un lector envíe una, aparece acá.</p>}
  {list.map(e=><div className="review" key={e.id}>
   <b>{bk(e.bookId).t}</b>
   <div className="muted">Lector: Vos · {"★".repeat(e.rating)}{"☆".repeat(5-e.rating)}</div>
   <p className="note">{e.review}</p>
   {rej===e.id?<>
    <div>{["Lenguaje ofensivo","Spoilers sin aviso","No es una reseña"].map(m=><button key={m} className={"chip"+(why===m?" active":"")} onClick={()=>setWhy(m)}>{m}</button>)}</div>
    <input className="field" placeholder="Motivo del rechazo" value={why} onChange={ev=>setWhy(ev.target.value)}/>
    <button className="chip active" disabled={!why.trim()} onClick={()=>{moderate(e.id,false,why.trim());setRej(null);setWhy("")}}>Confirmar rechazo</button>
    <button className="chip" onClick={()=>{setRej(null);setWhy("")}}>Cancelar</button>
   </>:<>
    <button className="chip active" onClick={()=>moderate(e.id,true)}>Aprobar</button>
    <button className="chip" onClick={()=>{setRej(e.id);setWhy("")}}>Rechazar</button>
   </>}
  </div>)}
  {done.length>0&&<p className="note">Ya moderadas: {done.filter(e=>e.rs==="approved").length} aprobadas · {done.filter(e=>e.rs==="rejected").length} rechazadas.</p>}
 </>;
}
