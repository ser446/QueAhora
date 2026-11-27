import {useEffect,useState} from "react";
import {listPublicCatalogReviews} from "../db.js";

export default function CatalogPublicReviews({bookId}){
 const [result,setResult]=useState(null);
 useEffect(()=>{
  let active=true;
  listPublicCatalogReviews(bookId).then(
   reviews=>{if(active)setResult({reviews})},
   ()=>{if(active)setResult({error:true})},
  );
  return()=>{active=false};
 },[bookId]);

 return <section>
  <h4 className="section">Reseñas públicas</h4>
  {!result&&<p className="note" role="status">Cargando reseñas…</p>}
  {result?.error&&<p className="note" role="alert">No pudimos cargar las reseñas públicas.</p>}
  {result?.reviews?.length===0&&<p className="note">Todavía no hay reseñas públicas.</p>}
  {result?.reviews?.map(review=><article className="review" key={review.id}>
   <b>{review.alias||"Lector"}</b>
   {review.contiene_spoilers?<details>
    <summary>Ver spoiler</summary>
    <p style={{whiteSpace:"pre-wrap",overflowWrap:"anywhere"}}>{review.contenido}</p>
   </details>:<p style={{whiteSpace:"pre-wrap",overflowWrap:"anywhere"}}>{review.contenido}</p>}
  </article>)}
 </section>;
}
