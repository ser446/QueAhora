import {useEffect,useState} from "react";
import {addCatalogBook,getCatalogBook} from "../db.js";
import {Cover} from "../ui.jsx";

const readingStates={
 pendiente:"Quiero leer",leyendo:"Leyendo",terminado:"Leído",abandonado:"Abandonado",
};

const argentinaDate=new Intl.DateTimeFormat("sv-SE",{timeZone:"America/Argentina/Buenos_Aires"});

const editionFields=[
 ["editorial","Editorial"],["anio_publicacion","Año de publicación"],
 ["paginas","Páginas"],["idioma","Idioma"],["formato","Formato"],
 ["isbn_13","ISBN-13"],["isbn_10","ISBN-10"],
];

export default function CatalogBook({id,onBack,user,onLogin,readingFinishedOn,inLibrary}){
 const [result,setResult]=useState(null);
 useEffect(()=>{
  let active=true;
  getCatalogBook(id).then(
   book=>{if(active)setResult({book})},
   ()=>{if(active)setResult({error:true})},
  );
  return()=>{active=false};
 },[id]);
 const book=result?.book;
 const [editionId,setEditionId]=useState("");
 const [choosing,setChoosing]=useState(false);
 const [status,setStatus]=useState("pendiente");
 const today=argentinaDate.format(new Date());
 const [finishedOn,setFinishedOn]=useState(today);
 const [saving,setSaving]=useState(false);
 const [feedback,setFeedback]=useState(null);

 const saveBook=async event=>{
  event.preventDefault();
  if(!user){onLogin();return}
  if(saving||feedback?.saved)return;
  setSaving(true);
  setFeedback(null);
  try {
   const added=await addCatalogBook(id,editionId||book.editions[0]?.id||null,
    status,status==="terminado"?finishedOn:null);
   setChoosing(false);
   setFeedback({saved:true,message:added?"Agregado a «"+readingStates[status]+"».":"Este libro ya está en tu biblioteca."});
  } catch(error) {
   setFeedback({saved:false,message:error.message});
  } finally {
   setSaving(false);
  }
 };

 return <>
  <button className="chip" onClick={onBack}>Volver</button>
  {!result&&<p className="note" role="status">Cargando ficha…</p>}
  {result?.error&&<p className="note" role="alert">No pudimos cargar la ficha del libro.</p>}
  {result&&!result.error&&!book&&<p className="note">La obra no está disponible.</p>}
  {book&&<>
   <h3>{book.t}</h3>
   {book.a&&<p>{book.a}</p>}
   {user&&readingFinishedOn&&<p className="note">
    Fecha de finalización · <time dateTime={readingFinishedOn}>
     {readingFinishedOn.split("-").reverse().join("/")}
    </time>
   </p>}
   {book.language&&<p className="muted">Idioma original · {book.language}</p>}
   {book.description&&<p className="note" style={{whiteSpace:"pre-wrap"}}>{book.description}</p>}
   {choosing&&user&&<form onSubmit={saveBook}>
    <label>Estado inicial
     <select className="search" value={status} disabled={saving} onChange={e=>setStatus(e.target.value)}>
      {Object.entries(readingStates).map(([value,label])=><option key={value} value={value}>{label}</option>)}
     </select>
    </label>
    {status==="terminado"&&<label>Fecha de finalización
     <input className="search" type="date" required max={today} value={finishedOn}
      disabled={saving} onChange={e=>setFinishedOn(e.target.value)}/>
    </label>}
   {book.editions.length>1&&
    <label>Edición para guardar
     <select className="search" value={editionId||book.editions[0].id} disabled={saving}
      onChange={event=>setEditionId(event.target.value)}>
      {book.editions.map((e,index)=><option key={e.id} value={e.id}>
       {["Edición "+(index+1),e.editorial,e.anio_publicacion,e.idioma,e.isbn_13||e.isbn_10].filter(Boolean).join(" · ")}
      </option>)}
     </select>
    </label>}
    <button className="btn" type="submit" disabled={saving}>{saving?"Guardando…":"Confirmar"}</button>
    <button className="chip" type="button" disabled={saving}
     onClick={()=>{setChoosing(false);setFeedback(null)}}>Cancelar</button>
   </form>}
   {!inLibrary&&!choosing&&!feedback?.saved&&<button className="btn" onClick={()=>user?setChoosing(true):onLogin()}>
    {user?"Agregar a mi biblioteca":"Ingresá para guardar el libro"}
   </button>}
   {feedback&&<p className="note" role={feedback.saved?"status":"alert"}>{feedback.message}</p>}
   <h4 className="section">Ediciones</h4>
   {!book.editions.length&&<p className="note">Todavía no hay ediciones cargadas.</p>}
   {book.editions.map(edition=>{
    const details=editionFields.filter(([key])=>edition[key]!=null&&edition[key]!=="");
    return <article className="listbook" key={edition.id}>
     <Cover b={book} url={edition.coverUrl} style={{width:96,height:144,flex:"none"}}/>
     <div>{details.length?details.map(([key,label])=>
      <div className="muted" key={key}><strong>{label}</strong> · {edition[key]}</div>
     ):<p className="note">Edición sin datos adicionales.</p>}</div>
    </article>;
   })}
  </>}
 </>;
}
