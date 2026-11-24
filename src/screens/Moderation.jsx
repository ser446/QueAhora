import {useState,useEffect} from "react";
import {PTS_RESENA} from "../data.js";
import * as db from "../db.js";

// Solo para administradores (App.jsx lo protege y la base de datos lo exige con is_admin()).
export default function Moderation({toast}){
 const [list,setList]=useState(null);
 const [rej,setRej]=useState(null);const [why,setWhy]=useState("");
 const [n,setN]=useState({ok:0,no:0});
 useEffect(()=>{db.listPending().then(setList).catch(e=>{toast(e.message);setList([])})},[]);
 const act=async(r,ok,reason)=>{
  try{await db.moderate(r.id,ok,reason);setList(l=>l.filter(x=>x.id!==r.id));setN(s=>ok?{...s,ok:s.ok+1}:{...s,no:s.no+1});
   toast(ok?"Reseña aprobada: suma "+PTS_RESENA+" puntos":"Reseña rechazada");setRej(null);setWhy("")}
  catch(e){toast(e.message)}
 };
 return <>
  <p className="note">Aprobar publica la reseña y suma {PTS_RESENA} puntos al lector. Al rechazar, el lector ve el motivo y puede corregirla.</p>
  <div className="section">Pendientes ({list?list.length:"…"})</div>
  {list&&list.length===0&&<p className="note">No hay reseñas pendientes. Cuando un lector envíe una, aparece acá.</p>}
  {(list||[]).map(r=><div className="review" key={r.id}>
   <b>{r.title}</b>
   <div className="muted">Lector: @{r.alias} · {"★".repeat(r.rating)}{"☆".repeat(5-r.rating)}</div>
   <p className="note">{r.body}</p>
   {rej===r.id?<>
    <div>{["Lenguaje ofensivo","Spoilers sin aviso","No es una reseña"].map(m=><button key={m} className={"chip"+(why===m?" active":"")} onClick={()=>setWhy(m)}>{m}</button>)}</div>
    <input className="field" placeholder="Motivo del rechazo" value={why} onChange={ev=>setWhy(ev.target.value)}/>
    <button className="chip active" disabled={!why.trim()} onClick={()=>act(r,false,why.trim())}>Confirmar rechazo</button>
    <button className="chip" onClick={()=>{setRej(null);setWhy("")}}>Cancelar</button>
   </>:<>
    <button className="chip active" onClick={()=>act(r,true)}>Aprobar</button>
    <button className="chip" onClick={()=>{setRej(r.id);setWhy("")}}>Rechazar</button>
   </>}
  </div>)}
  {(n.ok>0||n.no>0)&&<p className="note">En esta sesión: {n.ok} aprobadas · {n.no} rechazadas.</p>}
 </>;
}
