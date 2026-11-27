import {useEffect,useRef,useState} from "react";
import {listLatestLibraryImports,listLibraryImportReviewRows,processLatestLibraryImport,registerLibraryImport} from "../db.js";
import {parseLibraryCsv} from "../importCsv.js";

function newImportId(){
 const bytes=crypto.getRandomValues(new Uint8Array(16));
 bytes[6]=(bytes[6]&15)|64;
 bytes[8]=(bytes[8]&63)|128;
 const hex=Array.from(bytes,byte=>byte.toString(16).padStart(2,"0")).join("");
 return [hex.slice(0,8),hex.slice(8,12),hex.slice(12,16),hex.slice(16,20),hex.slice(20)].join("-");
}

function ImportReviewRows({importId}){
 const [result,setResult]=useState(null);
 useEffect(()=>{
  let active=true;
  listLibraryImportReviewRows(importId).then(
   rows=>{if(active)setResult({rows})},
   ()=>{if(active)setResult({error:true})},
  );
  return ()=>{active=false};
 },[importId]);

 if(!result)return <p className="note" role="status">Cargando filas para revisar…</p>;
 if(result.error)return <p className="note" role="alert">No pudimos cargar el detalle. Cerralo y volvé a abrirlo.</p>;
 if(!result.rows.length)return <p className="note">No hay filas marcadas para revisión.</p>;
 return <ul>{result.rows.map(row=><li key={row.numero_fila}>
  <b>{row.titulo_original||"Sin título"}</b>{row.autor_original&&" · "+row.autor_original}
  <div className="note">Registro {row.numero_fila} · {row.motivo||"Requiere revisión."}</div>
 </li>)}</ul>;
}

export default function ImportLibrary({go}){
 const [preview,setPreview]=useState(null);
 const [error,setError]=useState("");
 const [busy,setBusy]=useState(false);
 const [saved,setSaved]=useState(false);
 const [imports,setImports]=useState(null);
 const [revision,setRevision]=useState(0);
 const [openReviewId,setOpenReviewId]=useState(null);
 const working=useRef(false);

 useEffect(()=>{
  let active=true;
  listLatestLibraryImports().then(
   lots=>{if(active)setImports({lots})},
   ()=>{if(active)setImports({error:true})},
  );
  return ()=>{active=false};
 },[revision]);

 const refreshImports=()=>{
  setImports(null);
  setRevision(value=>value+1);
 };

 const load=async event=>{
  const file=event.target.files?.[0];
  if(working.current)return;
  setError("");
  setPreview(null);
  setSaved(false);
  if(!file)return;
  working.current=true;
  setBusy(true);
  try {
   if(file.size>10*1024*1024)throw new Error("Elegí un CSV de hasta 10 MB.");
   setPreview({...parseLibraryCsv(await file.text()),id:newImportId()});
  } catch(error) {
   setError(error.message);
  } finally {
   working.current=false;
   setBusy(false);
  }
 };

 const confirm=async()=>{
  if(working.current||saved||!preview)return;
  working.current=true;
  setBusy(true);
  setError("");
  try {
   await registerLibraryImport(preview.id,preview.origin,preview.records);
   setSaved(true);
   refreshImports();
  } catch(error) {
   setError(error.message);
  } finally {
   working.current=false;
   setBusy(false);
  }
 };

 const process=async origin=>{
  if(working.current)return;
  working.current=true;
  setBusy(true);
  setError("");
  try {
   await processLatestLibraryImport(origin);
   refreshImports();
  } catch(error) {
   setError(error.message);
  } finally {
   working.current=false;
   setBusy(false);
  }
 };

 return <>
  <button className="chip" disabled={busy} onClick={()=>go("library")}>Volver</button>
  <p>Seleccioná un CSV exportado desde Goodreads o Bookmory.</p>
  <label>Archivo CSV
   <input className="field" type="file" accept=".csv,text/csv" disabled={busy} onChange={load}/>
  </label>
  {error&&<p className="note" role="alert">{error}</p>}
  {preview&&<>
   <h3>{preview.origin==="goodreads"?"Goodreads":"Bookmory"} · {preview.records.length} filas</h3>
   <ul>{preview.records.slice(0,5).map(({titulo,autor},index)=><li key={index}>{titulo||"Sin título"}{autor&&" · "+autor}</li>)}</ul>
   {saved?<p role="status">Archivo registrado.</p>
    :<button className="btn" disabled={busy} onClick={confirm}>{busy?"Guardando…":"Confirmar importación"}</button>}
  </>}
  <h3 className="section">Últimos archivos guardados</h3>
  {!imports&&<p className="note" role="status">Cargando importaciones…</p>}
  {imports?.error&&<p className="note" role="alert">No pudimos cargar tus importaciones.</p>}
  {imports?.lots?.length===0&&<p className="note">Todavía no guardaste ningún archivo.</p>}
  {imports?.lots?.map(lot=><article className="review" key={lot.id}>
   <b>{lot.origen==="goodreads"?"Goodreads":"Bookmory"} · {lot.registros_analizados} filas</b>
   {lot.por_procesar
    ? <div><button className="chip" disabled={busy} onClick={()=>process(lot.origen)}>Procesar</button></div>
    : <p className="note">
     Incorporados: {lot.libros_incorporados} · Duplicados: {lot.duplicados_detectados}
     {" · "}Para revisar: {lot.pendientes_revision} · Errores: {lot.errores}
    </p>}
   {!lot.por_procesar&&lot.pendientes_revision>0&&<>
    <button className="chip" aria-expanded={openReviewId===lot.id}
     onClick={()=>setOpenReviewId(openReviewId===lot.id?null:lot.id)}>
     {openReviewId===lot.id?"Ocultar filas para revisar":"Ver filas para revisar"}
    </button>
    {openReviewId===lot.id&&<ImportReviewRows key={lot.id} importId={lot.id}/>}
   </>}
  </article>)}
 </>;
}
