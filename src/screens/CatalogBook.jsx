import {useEffect,useState} from "react";
import {getCatalogBook} from "../db.js";
import {Cover} from "../ui.jsx";

const editionFields=[
 ["editorial","Editorial"],["anio_publicacion","Año de publicación"],
 ["paginas","Páginas"],["idioma","Idioma"],["formato","Formato"],
 ["isbn_13","ISBN-13"],["isbn_10","ISBN-10"],
];

export default function CatalogBook({id,onBack}){
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
 return <>
  <button className="chip" onClick={onBack}>Volver</button>
  {!result&&<p className="note" role="status">Cargando ficha…</p>}
  {result?.error&&<p className="note" role="alert">No pudimos cargar la ficha del libro.</p>}
  {result&&!result.error&&!book&&<p className="note">La obra no está disponible.</p>}
  {book&&<>
   <h3>{book.t}</h3>
   {book.a&&<p>{book.a}</p>}
   {book.language&&<p className="muted">Idioma original · {book.language}</p>}
   {book.description&&<p className="note" style={{whiteSpace:"pre-wrap"}}>{book.description}</p>}
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
