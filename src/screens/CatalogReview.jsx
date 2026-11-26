import {useEffect,useState} from "react";
import {getCatalogReview,saveCatalogReview} from "../db.js";

const emptyReview={contenido:"",es_publica:true,contiene_spoilers:false};

export default function CatalogReview({entryId,openOnLoad}){
 const [result,setResult]=useState(null);
 const [draft,setDraft]=useState(null);
 const [saving,setSaving]=useState(false);
 const [feedback,setFeedback]=useState(null);

 useEffect(()=>{
  let active=true;
  getCatalogReview(entryId).then(
   review=>{
    if(!active)return;
    setResult({review});
    if(openOnLoad)setDraft(review??emptyReview);
   },
   ()=>{if(active)setResult({error:true})},
  );
  return ()=>{active=false};
 },[entryId,openOnLoad]);

 const save=async event=>{
  event.preventDefault();
  const review={...draft,contenido:draft.contenido.trim()};
  if(saving||!review.contenido)return;
  setSaving(true);
  setFeedback(null);
  try {
   await saveCatalogReview(entryId,review);
   setResult({review});
   setDraft(null);
   setFeedback({message:"Reseña guardada."});
  } catch(error) {
   setFeedback({error:true,message:error.message});
  } finally {
   setSaving(false);
  }
 };

 if(!result)return <p className="note" role="status">Cargando tu reseña…</p>;
 if(result.error)return <p className="note" role="alert">No pudimos cargar tu reseña.</p>;

 return <>
  {draft?<form onSubmit={save}>
   <label>Tu reseña
    <textarea className="field" rows={5} required value={draft.contenido} disabled={saving}
     onChange={event=>setDraft({...draft,contenido:event.target.value})}/>
   </label>
   <div><label>
    <input type="checkbox" checked={draft.es_publica} disabled={saving}
     onChange={event=>setDraft({...draft,es_publica:event.target.checked})}/>
    Reseña pública
   </label></div>
   <div><label>
    <input type="checkbox" checked={draft.contiene_spoilers} disabled={saving}
     onChange={event=>setDraft({...draft,contiene_spoilers:event.target.checked})}/>
    Contiene spoilers
   </label></div>
   <button className="btn" type="submit" disabled={saving||!draft.contenido.trim()}>
    {saving?"Guardando…":"Guardar reseña"}
   </button>
   <button className="chip" type="button" disabled={saving}
    onClick={()=>{setDraft(null);setFeedback(null)}}>Cancelar</button>
  </form>:<button className="btn" type="button"
   onClick={()=>{setDraft(result.review??emptyReview);setFeedback(null)}}>
   {result.review?"Editar reseña":"Escribir reseña"}
  </button>}
  {feedback&&<p className="note" role={feedback.error?"alert":"status"}>{feedback.message}</p>}
 </>;
}
