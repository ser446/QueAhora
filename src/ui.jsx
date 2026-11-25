import {useState} from "react";

export function Cover({b,cls="cover",style,url=b.coverUrl}) {
 const [failedUrl,setFailedUrl]=useState(null);
 return <div className={cls+" c"+b.c} style={{...style,overflow:"hidden",overflowWrap:"anywhere",position:"relative"}}>
  {url&&url!==failedUrl
    ? <img src={url} alt={"Tapa de "+b.t} loading="lazy" onError={()=>setFailedUrl(url)}
       style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"contain"}}/>
    : b.t.toUpperCase()}
 </div>;
}
export const Stars=({v,set})=><div className="stars" role="radiogroup" aria-label="Calificación">{[1,2,3,4,5].map(n=><button key={n} className={n<=v?"on":""} onClick={()=>set(n)} aria-label={n+" estrellas"}>★</button>)}</div>;
