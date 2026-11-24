// AUTENTICACIÓN DE DEMOSTRACIÓN — se usa solo cuando NO hay claves de Supabase configuradas.
// Guarda las cuentas en localStorage: NO es seguro y NO debe usarse en producción.
// Tiene el mismo contrato que auth.supabase.js (ver auth.js).
// Para probar el rol de administrador: registrate con el correo admin@queahora.demo
import {load, save} from "./demo.store.js";

const SESSION = "qa-session";
const ADMIN_EMAIL = "admin@queahora.demo";
const rd = () => { try { return JSON.parse(localStorage.getItem(SESSION)); } catch (e) { return null; } };
const wr = v => { try { localStorage.setItem(SESSION, JSON.stringify(v)); } catch (e) {} };
const norm = e => e.trim().toLowerCase();
const hex = b => [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, "0")).join("");
const pub = u => ({id: u.id, email: u.email, provider: u.provider || "password"});
const delay = () => new Promise(r => setTimeout(r, 300));
const salt = () => Math.random().toString(36).slice(2);

async function hash(pw, s) {
  if (!(globalThis.crypto && crypto.subtle)) return "plain:" + pw; // solo demo
  return hex(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s + pw)));
}

export const getUser = async () => {
  const id = rd();
  const u = Object.values(load().users).find(x => x.id === id);
  return u ? pub(u) : null;
};
export function onAuthChange() { return () => {}; }

export async function register({email, password, profile}) {
  await delay();
  const db = load(), k = norm(email);
  if (db.users[k]) throw new Error("Ya existe una cuenta con ese correo.");
  const a = (profile.alias || "").toLowerCase();
  if (Object.values(db.profiles).some(p => (p.alias || "").toLowerCase() === a)) throw new Error("Ese alias ya está en uso.");
  const s = salt();
  const u = {id: "u" + Date.now(), email: k, salt: s, hash: await hash(password, s), provider: "password"};
  db.users[k] = u;
  db.profiles[u.id] = {...profile, role: k === ADMIN_EMAIL ? "admin" : "user"};
  save(db); wr(u.id);
  return pub(u);
}

export async function login(email, password) {
  await delay();
  const u = load().users[norm(email)];
  // Mensaje genérico: no revela si el correo existe
  if (!u || !u.hash || u.hash !== await hash(password, u.salt)) throw new Error("Correo o contraseña incorrectos.");
  wr(u.id);
  return pub(u);
}

export async function loginWithGoogle() {
  await delay(); // En producción abre la ventana de Google
  const db = load(), k = "usuario.google@demo.local";
  const u = db.users[k] || (db.users[k] = {id: "g" + Date.now(), email: k, provider: "google"});
  if (!db.profiles[u.id]) db.profiles[u.id] = {nombre: "", apellido: "", alias: "", pais: "", provincia: "", localidad: "", role: "user"};
  save(db); wr(u.id);
  return pub(u);
}

export async function requestReset() { await delay(); return true; }

export async function resetPassword(email, password) {
  await delay();
  const db = load(), u = db.users[norm(email)];
  if (!u) throw new Error("No encontramos una cuenta con ese correo (solo demo).");
  u.salt = salt(); u.hash = await hash(password, u.salt);
  save(db);
  return null; // en el demo la persona vuelve a ingresar manualmente
}

export function logout() { wr(null); }
