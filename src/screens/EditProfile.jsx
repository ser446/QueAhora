import {useState,useEffect,useMemo} from "react";
import {BOOKS,CAT,SEED_REV,ST,FM,bk,fmt} from "../data.js";
import {Cover,Stars} from "../ui.jsx";

export default function EditProfile({prof,save}){
 const [f,setF]=useState(prof);
 const F=(k,l,ph)=><><div className="label">{l}</div><input className="field" placeholder={ph} value={f[k]} onChange={e=>setF({...f,[k]:e.target.value})}/></>;
 return <>
  {F("name","Nombre de usuario *","Cómo querés que te vean")}
  {F("city","Ciudad","Ej.: Ciudad Autónoma de Buenos Aires")}
  {F("hood","Barrio (opcional)","Ej.: Belgrano")}
  <button className="btn" disabled={!f.name.trim()} onClick={()=>save({name:f.name.trim(),city:f.city.trim(),hood:f.hood.trim()})}>Guardar cambios</button>
 </>;
}
