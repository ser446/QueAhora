export const BOOKS=[
 {id:1,t:"El jardín de la niebla",a:"Autor ficticio",r:4.5,p:320,g:"Novela",isbn:"9780000000011",c:0},
 {id:2,t:"La última puerta",a:"Autora ficticia",r:4.2,p:288,g:"Misterio",isbn:"9780000000028",c:1},
 {id:3,t:"El mapa perdido",a:"Autor ficticio",r:4.0,p:354,g:"Aventura",isbn:"9780000000035",c:2},
 {id:4,t:"Cartas a la marea",a:"Autora ficticia",r:3.9,p:210,g:"Narrativa",isbn:"9780000000042",c:3},
 {id:5,t:"Los relojes de Palermo",a:"Autor ficticio",r:4.3,p:402,g:"Histórica",isbn:"9780000000059",c:4}];
export const SEED_REV={1:[["Lector A",5,"Una historia que me atrapó desde el comienzo. La ambientación es excelente."],["Lector B",4,"Personajes interesantes y un final muy logrado."]]};
// Puntos: cambiá estos valores y todo el proyecto se actualiza (cálculo y textos)
export const PTS_LIBRO=3;   // por cada libro leído
export const PTS_RESENA=2;  // por cada reseña aprobada
export const ST=["Quiero leer","Leyendo","Leído"],FM=["Físico","Digital","Audio"];
export const SEED=[{id:1,bookId:3,status:"Leyendo",formats:["Físico"],date:"",rating:0,review:"",rs:"none"},{id:2,bookId:2,status:"Leyendo",formats:["Digital"],date:"",rating:0,review:"",rs:"none"}];
export let CAT=[...BOOKS];
export const setCatalog=c=>{CAT=c};
export const bk=id=>CAT.find(b=>b.id===id);
export const fmt=n=>String(n).replace(".",",");
