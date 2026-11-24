import {useEffect,useState} from "react";
import {CAT,fmt} from "../data.js";
import {searchCatalogBooks} from "../db.js";
import {isConfigured} from "../supabase.js";
import {Cover} from "../ui.jsx";

const cardStyle={width:"100%",border:0,textAlign:"left",color:"inherit",font:"inherit"};

export default function Search({go,q,setQ}){
 const term=q.trim();
 const [result,setResult]=useState(null);

 useEffect(()=>{
  if(!isConfigured||!term){setResult(null);return}
  let active=true;
  setResult(null);
  const timer=setTimeout(async()=>{
   try {
    const books=await searchCatalogBooks(term);
    if(active)setResult({term,books,error:false});
   } catch {
    if(active)setResult({term,books:[],error:true});
   }
  },250);
  return()=>{active=false;clearTimeout(timer)};
 },[term]);

 const current=result?.term===term?result:null;
 const res=isConfigured?(current?.books??[]):CAT.filter(b=>
  [b.t,b.a,b.isbn].some(value=>value?.toLowerCase().includes(term.toLowerCase()))
 );

 return <>
  <input className="search" autoFocus placeholder="Buscar título, autor o ISBN" value={q} onChange={e=>setQ(e.target.value)} aria-label="Buscar"/>
  {isConfigured&&!term&&<p className="note">Escribí un título, un autor o un ISBN completo para buscar.</p>}
  {isConfigured&&term&&!current&&<p className="note" role="status">Buscando…</p>}
  {current?.error&&<p className="note" role="alert">No pudimos buscar en el catálogo.</p>}
  {term&&res.length===0&&(!isConfigured||(current&&!current.error))&&
   <p className="note">No encontramos resultados para “{q}”. Probá con otro título, autor o ISBN.</p>}
  {res.map(b=>{
   const content=<><Cover b={b} cls="mini"/><div><b>{b.t}</b>
    {b.a&&<div className="muted">{b.a}{b.g?" · "+b.g:""}</div>}
    {!isConfigured&&<div className="muted">{b.r?"★ "+fmt(b.r):"Sin calificaciones"}</div>}</div></>;
   return isConfigured
    ? <article key={b.id} className="listbook">{content}</article>
    : <button key={b.id} className="listbook" style={{...cardStyle,cursor:"pointer"}} onClick={()=>go("book",{id:b.id})}>{content}</button>;
  })}
  <p className="note" style={{marginTop:14}}>¿No encontrás tu libro?</p>
  <button className="btn" style={{marginTop:6}} onClick={()=>go("add")}>Cargarlo manualmente</button>
 </>;
}
