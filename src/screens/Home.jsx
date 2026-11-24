import {CAT,bk,fmt} from "../data.js";
import {Cover} from "../ui.jsx";

export default function Home({go,user,entries,points,nRead,q,setQ}){
 const cur=entries.find(e=>e.status==="Leyendo");
 return <>
  <input className="search" placeholder="⌕ Buscar título, autor o ISBN" value={q} onChange={e=>setQ(e.target.value)} onKeyDown={e=>e.key==="Enter"&&go("search")} aria-label="Buscar"/>
  <div className="section">Para descubrir</div>
  <div className="row">{CAT.slice(0,2).map(b=><button key={b.id} className="book" onClick={()=>go("book",{id:b.id})}><Cover b={b}/><b>{b.t}</b><span className="muted">{b.a}{b.r?" · ★ "+fmt(b.r):""}</span></button>)}</div>
  {user?<>
   <div className="section">Tu lectura actual</div>
   {cur?<div className="listbook"><Cover b={bk(cur.bookId)} cls="mini"/><div><b>{bk(cur.bookId).t}</b><div className="muted">Leyendo · formato {cur.formats.join(", ").toLowerCase()}</div><button className="chip" onClick={()=>go("library")}>Ver mi biblioteca</button></div></div>
    :<p className="note">Todavía no empezaste ningún libro. Elegí uno en Buscar.</p>}
   <div className="section">Tus puntos</div>
   <div className="row"><div className="stat"><strong>{points}</strong><span className="muted">Puntos acumulados</span></div><div className="stat"><strong>{nRead}</strong><span className="muted">Libros leídos</span></div></div>
  </>:<>
   <div className="section">Tu biblioteca y tus puntos</div>
   <div className="stat" style={{textAlign:"left"}}><p className="note" style={{marginTop:0}}>Ingresá para guardar tus lecturas, escribir reseñas y sumar puntos.</p><button className="btn" style={{marginTop:6}} onClick={()=>go("login")}>Login</button></div>
  </>}
 </>;
}
