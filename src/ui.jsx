import {useState} from "react";

export const Cover=({b,cls="cover",style})=><div className={cls+" c"+b.c} style={style}>{b.t.toUpperCase()}</div>;
export const Stars=({v,set})=><div className="stars" role="radiogroup" aria-label="Calificación">{[1,2,3,4,5].map(n=><button key={n} className={n<=v?"on":""} onClick={()=>set(n)} aria-label={n+" estrellas"}>★</button>)}</div>;
