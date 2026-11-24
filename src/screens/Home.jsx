import {useEffect,useState} from "react";
import {listFeaturedBooks} from "../db.js";
import {isConfigured} from "../supabase.js";
import {bk,fmt} from "../data.js";
import {Cover} from "../ui.jsx";

export default function Home({go,user,entries,points,nRead,q,setQ}){
 const [catalog,setCatalog]=useState({books:[],loading:true,error:false});
 useEffect(()=>{
  let active=true;
  listFeaturedBooks().then(
   books=>{if(active)setCatalog({books,loading:false,error:false})},
   ()=>{if(active)setCatalog({books:[],loading:false,error:true})},
  );
  return ()=>{active=false};
 },[]);
 const cur=entries.find(e=>e.status==="Leyendo");
 return <>
  <input className="search" placeholder="⌕ Buscar título, autor o ISBN" value={q} onChange={e=>setQ(e.target.value)} onKeyDown={e=>e.key==="Enter"&&go("search")} aria-label="Buscar"/>
  <div className="section">Para descubrir</div>
  {catalog.loading&&<p className="note" role="status">Cargando libros…</p>}
  {catalog.error&&<p className="note" role="alert">No pudimos cargar los libros del catálogo.</p>}
  {!catalog.loading&&!catalog.error&&catalog.books.length===0&&<p className="note">Todavía no hay libros en el catálogo.</p>}
  <div className="row">{catalog.books.map(b=>{
   const card=<><Cover b={b}/><b>{b.t}</b>{b.a&&<span className="muted">{b.a}{b.r?" · ★ "+fmt(b.r):""}</span>}</>;
   return isConfigured
    ? <article key={b.id} className="book">{card}</article>
    : <button key={b.id} className="book" onClick={()=>go("book",{id:b.id})}>{card}</button>;
  })}</div>
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
