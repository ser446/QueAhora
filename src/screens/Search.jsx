import {useState,useEffect,useMemo} from "react";
import {BOOKS,CAT,SEED_REV,ST,FM,bk,fmt} from "../data.js";
import {Cover,Stars} from "../ui.jsx";

export default function Search({go,q,setQ}){
 const res=useMemo(()=>{const s=q.trim().toLowerCase();return CAT.filter(b=>!s||(b.t+b.a+b.isbn).toLowerCase().includes(s))},[q]);
 return <>
  <input className="search" autoFocus placeholder="Buscar título, autor o ISBN" value={q} onChange={e=>setQ(e.target.value)} aria-label="Buscar"/>
  {res.length===0&&<p className="note">No encontramos resultados para “{q}”. Probá con otro título, autor o ISBN.</p>}
  {res.map(b=><button key={b.id} className="listbook" style={{width:"100%",border:0,textAlign:"left",color:"inherit",font:"inherit",cursor:"pointer"}} onClick={()=>go("book",{id:b.id})}>
   <Cover b={b} cls="mini"/><div><b>{b.t}</b><div className="muted">{b.a} · {b.g}</div><div className="muted">{b.r?"★ "+fmt(b.r):"Sin calificaciones"}</div></div></button>)}
  <p className="note" style={{marginTop:14}}>¿No encontrás tu libro?</p>
  <button className="btn" style={{marginTop:6}} onClick={()=>go("add")}>Cargarlo manualmente</button>
 </>;
}
