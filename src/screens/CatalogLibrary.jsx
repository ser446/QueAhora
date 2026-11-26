import {useEffect,useRef,useState} from "react";
import {changeCatalogReadingStatus,listCatalogLibrary} from "../db.js";
import {Cover} from "../ui.jsx";

const labels={pendiente:"Quiero leer",leyendo:"Leyendo",terminado:"Leído",abandonado:"Abandonado"};

const transitions={
 pendiente:["leyendo","terminado","abandonado"],
 leyendo:["pendiente","terminado","abandonado"],
 abandonado:["pendiente","leyendo"],
 terminado:[],
};
const argentinaDate=new Intl.DateTimeFormat("sv-SE",{timeZone:"America/Argentina/Buenos_Aires"});

export default function CatalogLibrary({userId,go,filter}){
 const [result,setResult]=useState(null);
 const [saving,setSaving]=useState(false);
 const mounted=useRef(false);
 const [feedback,setFeedback]=useState(null);

 const [finishingId,setFinishingId]=useState(null);
 const [finishedOn,setFinishedOn]=useState("");
 const today=argentinaDate.format(new Date());

 const changeStatus=async (entry,status,date=null)=>{
  if(saving)return;
  setSaving(true);
  setFeedback(null);
  try {
   const readingId=await changeCatalogReadingStatus(entry.id,entry.readingId,entry.status,status,date);
   if(!mounted.current)return;
   if(!readingId){
    setFinishingId(null);
    const entries=await listCatalogLibrary(userId);
    if(!mounted.current)return;
    setResult({entries});
    setFeedback({error:true,message:"El estado cambió. Revisá tu biblioteca e intentá de nuevo."});
    return;
   }
   setResult(current=>({entries:current.entries.map(item=>item.id===entry.id
    ? {...item,readingId,status,finishedOn:date}
    : item)}));
   setFinishingId(null);
   setFeedback({message:"«"+entry.book.t+"» pasó a "+labels[status]+"."});
   go("library",{f:status});
  } catch(error) {
   setFeedback({error:true,message:error.message});
  } finally {
   setSaving(false);
  }
 };

 const selectStatus=(entry,status)=>{
  setFeedback(null);
  if(status==="terminado"){
   setFinishingId(entry.id);
   setFinishedOn(today);
   return;
  }
  setFinishingId(null);
  changeStatus(entry,status);
 };

 useEffect(()=>{
  let active=true;
  mounted.current=true;
  listCatalogLibrary(userId).then(
   entries=>{if(active)setResult({entries})},
   ()=>{if(active)setResult({error:true})},
  );
  return()=>{active=false;mounted.current=false};
 },[userId]);

 const visible=result?.entries?.filter(entry=>entry.status===filter)??[];
 return <>
  <div>{Object.entries(labels).map(([status,label])=>
   <button key={status} className={"chip"+(status===filter?" active":"")}
    aria-pressed={status===filter} disabled={saving} onClick={()=>{setFinishingId(null);setFeedback(null);go("library",{f:status})}}>{label}</button>
  )}</div>
  <div className="section">{labels[filter]}</div>
  {!result&&<p className="note" role="status">Cargando tu biblioteca…</p>}
  {result?.error&&<p className="note" role="alert">No pudimos cargar tu biblioteca.</p>}
  {result?.entries&&visible.length===0&&<p className="note">No hay libros en «{labels[filter]}».</p>}
  {feedback&&<p className="note" role={feedback.error?"alert":"status"}>{feedback.message}</p>}
  {visible.map(entry=><article className="catalog-library-card" key={entry.id}>
   <div className="catalog-library-row">
    <button className="catalog-library-book"
    disabled={saving} onClick={()=>go("catalogBook",{id:entry.book.id,from:"library",libraryFilter:filter,finishedOn:entry.finishedOn})}>
    <Cover b={entry.book} cls="mini"/>
    <div><b>{entry.book.t}</b>{entry.book.a&&<div className="muted">{entry.book.a}</div>}
    {entry.format&&<div className="muted">Formato · {entry.format}</div>}</div>
    </button>
    {transitions[entry.status]?.length>0
     ? <select className="chip" value={finishingId===entry.id?"terminado":entry.status}
       aria-label={"Estado de "+entry.book.t} disabled={saving}
       onChange={event=>{
        const status=event.target.value;
        if(status===entry.status){setFinishingId(null);setFeedback(null)}
        else selectStatus(entry,status);
       }}>
       <option value={entry.status}>{labels[entry.status]}</option>
       {transitions[entry.status].map(status=><option key={status} value={status}>{labels[status]}</option>)}
      </select>
     : <span className="muted">{labels[entry.status]}</span>}
   </div>
   {finishingId===entry.id&&<form onSubmit={event=>{
    event.preventDefault();
    changeStatus(entry,"terminado",finishedOn);
   }}>
    <label>Fecha de finalización
     <input className="search" type="date" required max={today} value={finishedOn}
      disabled={saving} onChange={event=>setFinishedOn(event.target.value)}/>
    </label>
    <button className="chip" type="submit" disabled={saving}>{saving?"Guardando…":"Confirmar"}</button>
    <button className="chip" type="button" disabled={saving}
     onClick={()=>{setFinishingId(null);setFeedback(null)}}>Cancelar</button>
   </form>}
  </article>)}
  <button className="btn" disabled={saving} onClick={()=>go("search")}>Buscar libros</button>
 </>;
}
