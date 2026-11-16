import {useState,useEffect,useMemo} from "react";
import {BOOKS,CAT,SEED_REV,ST,FM,bk,fmt} from "../data.js";
import {Cover,Stars} from "../ui.jsx";

export default function Log({entry,upd,go,toast}){
 const [f,setF]=useState(()=>({...entry,date:entry.date||new Date().toISOString().slice(0,10)}));
 if(!entry)return <p className="note">No encontramos esa lectura.</p>;
 const b=bk(entry.bookId),set=p=>setF({...f,...p});
 const save=()=>{const t=f.review.trim();const rs=!t?"none":(t!==entry.review.trim()||entry.rs==="none")?"pending":entry.rs;upd(entry.id,{...f,rs,date:f.status==="Leído"?f.date:""});toast(rs==="pending"?"Lectura guardada. Tu reseña está en revisión":"Lectura guardada");go("library",{f:f.status})};
 return <>
  <b>{b.t}</b>
  <div className="label">Estado de lectura</div>
  <div>{ST.map(s=><button key={s} className={"chip"+(f.status===s?" active":"")} onClick={()=>set({status:s})}>{s}</button>)}</div>
  {f.status==="Leído"&&<><div className="label">Fecha de finalización</div><input type="date" className="field" value={f.date} onChange={e=>set({date:e.target.value})}/></>}
  <div className="label">Formatos (podés elegir varios)</div>
  <div>{FM.map(s=>{const on=f.formats.includes(s);return <button key={s} className={"chip"+(on?" active":"")} aria-pressed={on} onClick={()=>set({formats:on?(f.formats.length>1?f.formats.filter(x=>x!==s):f.formats):[...f.formats,s]})}>{s}</button>})}</div>
  <div className="label">Tu calificación</div>
  <Stars v={f.rating} set={n=>set({rating:n})}/>
  <div className="label">Tu reseña (opcional)</div>
  <textarea className="field" rows="4" placeholder="¿Qué te pareció este libro? Compartí tu opinión..." value={f.review} onChange={e=>set({review:e.target.value})}/>
  <button className="btn" onClick={save}>Guardar lectura</button>
  <p className="note">Las reseñas se publican para todos los lectores después de ser aprobadas. Mientras tanto, solo las ves vos.</p>
 </>;
}
