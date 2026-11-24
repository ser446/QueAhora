import {PTS_LIBRO,PTS_RESENA} from "../data.js";

export default function Profile({user,profile,nRead,nRev,pend,go,points,toast,onLogout}){
 const p=profile||{};
 const lugar=[p.localidad,p.provincia,p.pais].filter(Boolean).join(", ");
 return <>
  <div className="row" style={{alignItems:"center"}}><div style={{width:62,height:62,borderRadius:"50%",background:"var(--chip)",display:"grid",placeItems:"center",fontSize:30}}>☺</div>
   <div><b>{[p.nombre,p.apellido].filter(Boolean).join(" ")||user.email}</b>
    {p.alias&&<div className="muted">@{p.alias}</div>}
    {lugar&&<div className="muted">{lugar}</div>}
    {p.role==="admin"&&<span className="chip" style={{cursor:"default"}}>Administrador</span>}</div></div>
  <div className="section">Mi actividad</div>
  <div className="row"><div className="stat"><strong>{nRead}</strong><span className="muted">Libros leídos</span></div><div className="stat"><strong>{nRev}</strong><span className="muted">Reseñas</span></div></div>
  <div className="section">Mis puntos</div>
  <div className="stat" style={{textAlign:"left"}}><strong>{points} ✦</strong><div className="muted">Puntos acumulados</div><p className="note">Ganás {PTS_LIBRO} puntos por cada libro leído y {PTS_RESENA} por cada reseña aprobada. Los canjes se habilitarán con comercios participantes.</p></div>
  {pend>0&&<p className="note" style={{marginTop:12}}>Tenés {pend} {pend===1?"reseña":"reseñas"} en revisión. Suman puntos cuando se aprueban.</p>}
  <div className="section">Mi cuenta</div>
  <button className="item" onClick={()=>go("edit")}>Editar perfil y ubicación <span>›</span></button>
  <button className="item" onClick={()=>toast("Próximamente: importar tu biblioteca desde un archivo")}>Importar biblioteca <span className="muted">(próximamente)</span></button>
  <button className="item" onClick={onLogout}>Cerrar sesión <span>›</span></button>
 </>;
}
