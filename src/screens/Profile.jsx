import {useState,useEffect,useMemo} from "react";
import {BOOKS,CAT,SEED_REV,ST,FM,bk,fmt,PTS_LIBRO,PTS_RESENA} from "../data.js";
import {Cover,Stars} from "../ui.jsx";

export default function Profile({nRead,nRev,pend,go,prof,points,toast}){
 return <>
  <div className="row" style={{alignItems:"center"}}><div style={{width:62,height:62,borderRadius:"50%",background:"var(--chip)",display:"grid",placeItems:"center",fontSize:30}}>☺</div>
   <div><b>{prof.name}</b><div className="muted">{prof.city}</div>{prof.hood&&<div className="muted">Barrio: {prof.hood}</div>}</div></div>
  <div className="section">Mi actividad</div>
  <div className="row"><div className="stat"><strong>{nRead}</strong><span className="muted">Libros leídos</span></div><div className="stat"><strong>{nRev}</strong><span className="muted">Reseñas</span></div></div>
  <div className="section">Mis puntos</div>
  <div className="stat" style={{textAlign:"left"}}><strong>{points} ✦</strong><div className="muted">Puntos acumulados</div><p className="note">Ganás {PTS_LIBRO} puntos por cada libro leído y {PTS_RESENA} por cada reseña aprobada. Los canjes se habilitarán con comercios participantes.</p></div>
  {pend>0&&<p className="note" style={{marginTop:12}}>Tenés {pend} {pend===1?"reseña":"reseñas"} en revisión. Suman puntos cuando se aprueban.</p>}
  <button className="item" onClick={()=>go("mod")}>Moderar reseñas (demo) <span>{pend>0?pend+" pendientes":"›"}</span></button>
  <div className="section">Mi cuenta</div>
  <button className="item" onClick={()=>go("edit")}>Editar perfil y ubicación <span>›</span></button>
  <button className="item" onClick={()=>toast("Próximamente: importar tu biblioteca desde un archivo")}>Importar biblioteca <span className="muted">(próximamente)</span></button>
 </>;
}
