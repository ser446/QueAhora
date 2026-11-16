import {useState,useEffect,useMemo} from "react";
import {BOOKS,CAT,SEED_REV,ST,FM,bk,fmt} from "../data.js";
import {Cover,Stars} from "../ui.jsx";

export default function Library({go,entries,nextStatus,filter}){
 const list=entries.filter(e=>e.status===filter);
 return <>
  <div>{ST.map(s=><button key={s} className={"chip"+(s===filter?" active":"")} onClick={()=>go("library",{f:s})}>{s}</button>)}</div>
  <div className="section">{filter==="Leyendo"?"Leyendo ahora":filter}</div>
  {list.length===0&&<p className="note">No hay libros en “{filter}”. Agregá uno desde Buscar.</p>}
  {list.map(e=>{const b=bk(e.bookId);return <div className="listbook" key={e.id}>
   <Cover b={b} cls="mini"/>
   <div style={{flex:1}}><b>{b.t}</b><div className="muted">{b.a}</div><div className="muted">Formatos: {e.formats.join(", ").toLowerCase()}</div>
    <button className="chip" onClick={()=>nextStatus(e)}>Cambiar estado</button><button className="chip" onClick={()=>go("log",{entryId:e.id})}>Registrar</button></div></div>})}
  <button className="btn" onClick={()=>go("search")}>+ Agregar un libro</button>
  <p className="note">Un mismo libro puede registrar varias lecturas en diferentes fechas y formatos.</p>
 </>;
}
