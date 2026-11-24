import {load, save} from "./demo.store.js";
import {coverIdx} from "./data.js";

const wait = () => new Promise(r => setTimeout(r, 120));
const stars = (db, bookId) => db.entries.filter(e => e.book_id === bookId && e.rating > 0);
const bookOut = (db, b) => {
  const rs = stars(db, b.id);
  const r = rs.length ? rs.reduce((s, e) => s + e.rating, 0) / rs.length : (b.base || 0);
  return {id: b.id, t: b.title, a: b.author, p: b.pages || 0, g: b.genre || "Sin género", isbn: b.isbn || "", r: Math.round(r * 10) / 10, c: coverIdx(b.id)};
};
const merge = (db, e) => {
  const rv = db.reviews.find(r => r.user_id === e.user_id && r.book_id === e.book_id);
  return {id: e.id, bookId: e.book_id, status: e.status, formats: e.formats, date: e.finished_on || "", rating: e.rating || 0,
    review: rv ? rv.body : "", rs: rv ? rv.status : "none", reason: rv ? rv.reason || "" : ""};
};
const taken = (db, alias, uid) => Object.entries(db.profiles).some(([id, p]) => id !== uid && (p.alias || "").toLowerCase() === alias.toLowerCase());

export async function listBooks() { await wait(); const db = load(); return db.books.map(b => bookOut(db, b)); }

export async function addBook(userId, b) {
  await wait(); const db = load();
  const nb = {id: db.seq++, title: b.t, author: b.a, pages: b.p, genre: b.g, isbn: b.isbn, base: 0};
  db.books.push(nb); save(db);
  return bookOut(db, nb);
}

export async function getProfile(userId) { await wait(); return load().profiles[userId] || null; }

export async function aliasAvailable(alias) { return !taken(load(), alias, null); }

export async function saveProfile(userId, f) {
  await wait(); const db = load();
  if (taken(db, f.alias, userId)) throw new Error("Ese alias ya está en uso.");
  db.profiles[userId] = {...(db.profiles[userId] || {role: "user"}), ...f};
  save(db);
  return db.profiles[userId];
}

export async function listEntries(userId) { await wait(); const db = load(); return db.entries.filter(e => e.user_id === userId).map(e => merge(db, e)); }

export async function addEntry(userId, bookId) {
  await wait(); const db = load();
  const e = {id: db.seq++, user_id: userId, book_id: bookId, status: "Quiero leer", formats: ["Físico"], finished_on: null, rating: 0};
  db.entries.push(e); save(db);
  return merge(db, e);
}

export async function saveEntry(userId, e) {
  await wait(); const db = load();
  const row = db.entries.find(x => x.id === e.id && x.user_id === userId);
  if (!row) throw new Error("No encontramos esa lectura.");
  Object.assign(row, {status: e.status, formats: e.formats, finished_on: e.status === "Leído" && e.date ? e.date : null, rating: e.rating || 0});
  const body = (e.review || "").trim();
  const i = db.reviews.findIndex(r => r.user_id === userId && r.book_id === row.book_id);
  if (!body) { if (i >= 0) db.reviews.splice(i, 1); }
  else if (i < 0) db.reviews.push({id: db.seq++, user_id: userId, book_id: row.book_id, rating: row.rating, body, status: "pending", reason: ""});
  else { const r = db.reviews[i]; if (r.body !== body) { r.body = body; r.status = "pending"; r.reason = ""; } r.rating = row.rating; }
  save(db);
  return merge(db, row);
}

export async function listReviews(bookId, userId) {
  await wait(); const db = load();
  return db.reviews.filter(r => r.book_id === bookId && (r.status === "approved" || r.user_id === userId)).map(r => ({
    id: r.id, alias: r.alias || db.profiles[r.user_id]?.alias || "Lector", rating: r.rating || 0, body: r.body,
    status: r.status, reason: r.user_id === userId ? r.reason || "" : "", mine: r.user_id === userId}));
}

export async function listPending() {
  await wait(); const db = load();
  return db.reviews.filter(r => r.status === "pending").map(r => ({
    id: r.id, bookId: r.book_id, title: db.books.find(b => b.id === r.book_id)?.title || "Libro",
    alias: db.profiles[r.user_id]?.alias || "Lector", rating: r.rating || 0, body: r.body}));
}

export async function moderate(id, ok, reason) {
  await wait(); const db = load();
  const r = db.reviews.find(x => x.id === id);
  if (r) { r.status = ok ? "approved" : "rejected"; r.reason = ok ? "" : reason || ""; save(db); }
}
