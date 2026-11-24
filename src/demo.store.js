// Base de datos de DEMOSTRACIÓN en localStorage (todas las cuentas comparten este "servidor" local).
// Con Supabase configurado no se usa.
import {BOOKS} from "./data.js";

const KEY = "qa-demo-db-v2";
const fresh = () => ({
  seq: 100,
  users: {}, profiles: {}, entries: [],
  books: BOOKS.map(b => ({id: b.id, title: b.t, author: b.a, pages: b.p, genre: b.g, isbn: b.isbn, base: b.r})),
  reviews: [
    {id: 1, user_id: "seed-a", alias: "lector_a", book_id: 1, rating: 5, body: "Una historia que me atrapó desde el comienzo. La ambientación es excelente.", status: "approved", reason: ""},
    {id: 2, user_id: "seed-b", alias: "lector_b", book_id: 1, rating: 4, body: "Personajes interesantes y un final muy logrado.", status: "approved", reason: ""}
  ]
});
export const load = () => { try { const s = localStorage.getItem(KEY); return s ? JSON.parse(s) : fresh(); } catch (e) { return fresh(); } };
export const save = db => { try { localStorage.setItem(KEY, JSON.stringify(db)); } catch (e) {} };
