import {useState,useEffect,useMemo} from "react";
import {BOOKS,CAT,ST,FM,bk,fmt} from "../data.js";
import {Cover,Stars} from "../ui.jsx";

export default function AddBook({addBook}){
 const [f,setF]=useState({t:"",a:"",p:"",g:"",isbn:""});
 const ok=f.t.trim()&&f.a.trim();
 const F=(k,l,ph,type)=><><div className="label">{l}</div><input className="field" type={type||"text"} placeholder={ph} value={f[k]} onChange={e=>setF({...f,[k]:e.target.value})}/></>;
 return <>
  <p className="note">Si no encontraste tu libro, cargalo vos. Queda disponible para todos los lectores.</p>
  {F("t","Título *","Ej.: Los relojes de Palermo")}
  {F("a","Autor o autora *","Nombre y apellido")}
  {F("g","Género","Novela, ensayo, poesía...")}
  {F("p","Páginas","320","number")}
  {F("isbn","ISBN (opcional)","978...")}
  <button className="btn" disabled={!ok} onClick={()=>addBook({t:f.t.trim(),a:f.a.trim(),p:+f.p||0,g:f.g.trim()||"Sin género",isbn:f.isbn.trim()})}>Cargar libro</button>
  <p className="note">En la versión real, al escribir el ISBN completaremos título, autor y portada desde Google Books u Open Library.</p>
 </>;
}
