// Catálogo de ejemplo: siembra el modo demo. Con Supabase el catálogo vive en la tabla "books".
export const BOOKS=[
 {id:1,t:"El jardín de la niebla",a:"Autor ficticio",r:4.5,p:320,g:"Novela",isbn:"9780000000011",c:0},
 {id:2,t:"La última puerta",a:"Autora ficticia",r:4.2,p:288,g:"Misterio",isbn:"9780000000028",c:1},
 {id:3,t:"El mapa perdido",a:"Autor ficticio",r:4.0,p:354,g:"Aventura",isbn:"9780000000035",c:2},
 {id:4,t:"Cartas a la marea",a:"Autora ficticia",r:3.9,p:210,g:"Narrativa",isbn:"9780000000042",c:3},
 {id:5,t:"Los relojes de Palermo",a:"Autor ficticio",r:4.3,p:402,g:"Histórica",isbn:"9780000000059",c:4}];

// Puntos: cambiá estos valores y todo el proyecto se actualiza (cálculo y textos)
export const PTS_LIBRO=3;   // por cada libro leído
export const PTS_RESENA=2;  // por cada reseña aprobada

export const ST=["Quiero leer","Leyendo","Leído"],FM=["Físico","Digital","Audio"];
export const coverIdx=id=>Math.abs(Number(id)||0)%5;

// Catálogo cargado en memoria (lo completa App.jsx desde db.js)
export let CAT=[];
export const setCatalog=c=>{CAT=c};
export const bk=id=>CAT.find(b=>b.id===id)||{id,t:"Libro",a:"",r:0,p:0,g:"",isbn:"",c:coverIdx(id)};
export const fmt=n=>String(n).replace(".",",");
