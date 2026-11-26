import {supabase} from "./supabase.js";
import {coverIdx} from "./data.js";

const fail = (e, fallback) => {
  if (e && e.code === "23505") throw new Error("Ese alias ya está en uso.");
  if (e && e.code === "42501") throw new Error("No tenés permiso para hacer esto.");
  throw new Error(fallback || "No pudimos completar la acción. Probá de nuevo.");
};

const toBook = r => ({id: r.id, t: r.title, a: r.author, p: r.pages || 0, g: r.genre || "Sin género", isbn: r.isbn || "",
  r: r.avg_rating ? Number(r.avg_rating) : 0, c: coverIdx(r.id)});
const toProfile = r => r ? ({nombre: r.nombre || "", apellido: r.apellido || "", alias: r.alias || "", pais: r.pais || "",
  provincia: r.provincia || "", localidad: r.localidad || "", role: r.role || "user"}) : null;
const toEntry = (e, rv) => ({id: e.id, bookId: e.book_id, status: e.status, formats: e.formats || ["Físico"], date: e.finished_on || "",
  rating: e.rating || 0, review: rv ? rv.body : "", rs: rv ? rv.status : "none", reason: rv ? rv.reject_reason || "" : ""});

// ---- Catálogo
const catalogColumns = "id, titulo, obras_autores(orden_autoria, autores(nombre))";

const toCatalogBook = obra => ({
    id: obra.id,
    t: obra.titulo,
    a: (obra.obras_autores ?? [])
      .sort((a, b) => (a.orden_autoria ?? Infinity) - (b.orden_autoria ?? Infinity))
      .map(relacion => relacion.autores?.nombre)
      .filter(Boolean)
      .join(", "),
    c: parseInt(obra.id.slice(0, 8), 16) % 5,
});

function catalogQuery(columns = catalogColumns) {
  return supabase.from("obras").select(columns);
}

function coverUrl(path) {
  return path ? supabase.storage.from("tapas-libros").getPublicUrl(path).data.publicUrl : null;
}

async function withCatalogCovers(books) {
  if (!books.length) return books;

  const {data, error} = await supabase.from("ediciones")
    .select("id, obra_id, tapa_ruta")
    .in("obra_id", books.map(book => book.id))
    .not("tapa_ruta", "is", null)
    .order("id");
  // Las tarjetas mantienen la portada provisoria si no pueden leer las tapas.
  if (error) return books;

  const firstCover = new Map();
  for (const edition of data) {
    if (edition.tapa_ruta && !firstCover.has(edition.obra_id)) {
      firstCover.set(edition.obra_id, coverUrl(edition.tapa_ruta));
    }
  }
  return books.map(book => ({...book, coverUrl: firstCover.get(book.id)}));
}

export async function listFeaturedBooks() {
  const {data, error} = await catalogQuery()
    .order("creado_en", {ascending: false})
    .order("id")
    .limit(2);
  if (error) fail(error, "No pudimos cargar los libros del catálogo.");
  return withCatalogCovers(data.map(toCatalogBook));
}

export async function searchCatalogBooks(query) {
  const term = query.trim();
  if (!term) return [];

  const pattern = "%" + term.replace(/[\\%_]/g, "\\$&").replaceAll("*", "\\%") + "%";
  const isbn = term.replace(/[\s-]/g, "").toUpperCase();
  const queries = [
    catalogQuery().ilike("titulo", pattern),
    catalogQuery(catalogColumns + ", coincidencias:obras_autores!inner(autores!inner(nombre))")
      .ilike("coincidencias.autores.nombre", pattern),
  ];
  if (/^[0-9]{13}$/.test(isbn)) {
    queries.push(catalogQuery(catalogColumns + ", coincidencias:ediciones!inner(isbn_13)")
      .eq("coincidencias.isbn_13", isbn));
  } else if (/^[0-9]{9}[0-9X]$/.test(isbn)) {
    queries.push(catalogQuery(catalogColumns + ", coincidencias:ediciones!inner(isbn_10)")
      .eq("coincidencias.isbn_10", isbn));
  }

  const results = await Promise.all(queries.map(request =>
    request.order("titulo").order("id").limit(30)
  ));
  const failed = results.find(result => result.error);
  if (failed) fail(failed.error, "No pudimos buscar en el catálogo.");

  const books = new Map();
  for (const result of results) {
    for (const obra of result.data) books.set(obra.id, toCatalogBook(obra));
  }
  return withCatalogCovers([...books.values()].slice(0, 30));
}

export async function getCatalogBook(id) {
  const editionFields = "id, isbn_13, isbn_10, editorial, anio_publicacion, paginas, idioma, formato";
  const get = fields => catalogQuery(
    catalogColumns + ", descripcion, idioma_original, ediciones(" + fields + ")"
  ).eq("id", id).order("id", {referencedTable: "ediciones"}).maybeSingle();

  let result = await get(editionFields + ", tapa_ruta");
  // Permite probar la ficha antes de instalar la columna de tapas.
  if (result.error?.code === "42703" && result.error.message.includes("tapa_ruta")) {
    result = await get(editionFields);
  }
  if (result.error) fail(result.error, "No pudimos cargar la ficha del libro.");
  if (!result.data) return null;

  const obra = result.data;
  return {
    ...toCatalogBook(obra),
    description: obra.descripcion,
    language: obra.idioma_original,
    editions: (obra.ediciones ?? []).map(edition => ({
      ...edition,
      coverUrl: coverUrl(edition.tapa_ruta),
    })),
  };
}

export async function addCatalogBook(bookId, editionId, status, finishedOn) {
  const {data, error} = await supabase.rpc("agregar_libro_biblioteca", {
    p_obra_id: bookId,
    p_edicion_id: editionId,
    p_estado: status,
    p_fecha_fin: finishedOn,
  });
  if (error) fail(error, "No pudimos agregar este libro a tu biblioteca.");
  return data;
}

export async function listCatalogLibrary(userId) {
  const {data, error} = await supabase.from("biblioteca_usuario")
    .select("id, obras(" + catalogColumns + "), ediciones!biblioteca_edicion_obra_correcta(formato, tapa_ruta), lecturas(id, estado, fecha_fin, creado_en)")
    .eq("usuario_id", userId)
    .order("agregado_en", {ascending: false})
    .order("id")
    .order("creado_en", {referencedTable: "lecturas", ascending: false})
    .order("id", {referencedTable: "lecturas"})
    .limit(1, {referencedTable: "lecturas"});
  if (error) fail(error, "No pudimos cargar tu biblioteca.");
  return data.filter(entry => entry.obras).map(entry => ({
    id: entry.id,
    book: {
  ...toCatalogBook(entry.obras),
  coverUrl: coverUrl(entry.ediciones?.tapa_ruta),
},
    format: entry.ediciones?.formato,
    status: entry.lecturas?.[0]?.estado ?? "pendiente",
    finishedOn: entry.lecturas?.[0]?.fecha_fin,
  }));
}

export async function listBooks() {
  const {data, error} = await supabase.rpc("books_with_stats");
  if (error) fail(error, "No pudimos cargar los libros.");
  return data.map(toBook);
}
export async function addBook(userId, b) {
  const {data, error} = await supabase.from("books")
    .insert({title: b.t, author: b.a, pages: b.p || null, genre: b.g, isbn: b.isbn || null, created_by: userId}).select().single();
  if (error) fail(error);
  return toBook(data);
}

// ---- Perfiles
export async function getProfile(userId) {
  const {data, error} = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
  if (error) fail(error, "No pudimos cargar tu perfil.");
  return toProfile(data);
}
export async function saveProfile(userId, f) {
  const {data, error} = await supabase.from("profiles")
    .update({nombre: f.nombre, apellido: f.apellido, alias: f.alias, pais: f.pais, provincia: f.provincia, localidad: f.localidad})
    .eq("id", userId).select().single();
  if (error) fail(error);
  return toProfile(data);
}
export async function aliasAvailable(alias) {
  const {data, error} = await supabase.rpc("alias_available", {a: alias});
  return error ? true : Boolean(data); // si falla la consulta, la base de datos igual impide duplicados
}

// ---- Lecturas del usuario
export async function listEntries(userId) {
  const [a, b] = await Promise.all([
    supabase.from("reading_entries").select("*").eq("user_id", userId),
    supabase.from("reviews").select("*").eq("user_id", userId)
  ]);
  if (a.error || b.error) fail(a.error || b.error, "No pudimos cargar tu biblioteca.");
  return a.data.map(e => toEntry(e, b.data.find(r => r.book_id === e.book_id)));
}
export async function addEntry(userId, bookId) {
  const {data, error} = await supabase.from("reading_entries")
    .insert({user_id: userId, book_id: bookId, status: "Quiero leer", formats: ["Físico"]}).select().single();
  if (error) fail(error);
  return toEntry(data, null);
}
export async function saveEntry(userId, e) {
  const {data: ent, error} = await supabase.from("reading_entries")
    .update({status: e.status, formats: e.formats, finished_on: e.status === "Leído" && e.date ? e.date : null, rating: e.rating || null})
    .eq("id", e.id).eq("user_id", userId).select().single();
  if (error) fail(error);
  const {data: old} = await supabase.from("reviews").select("*").eq("user_id", userId).eq("book_id", ent.book_id).maybeSingle();
  const body = (e.review || "").trim();
  let rv = old;
  if (!body) {
    if (old) { await supabase.from("reviews").delete().eq("id", old.id); rv = null; }
  } else if (!old) {
    const r = await supabase.from("reviews").insert({user_id: userId, book_id: ent.book_id, body, rating: e.rating || null}).select().single();
    if (r.error) fail(r.error);
    rv = r.data; // el trigger la deja en "pending"
  } else if (old.body !== body || (old.rating || 0) !== (e.rating || 0)) {
    const r = await supabase.from("reviews").update({body, rating: e.rating || null}).eq("id", old.id).select().single();
    if (r.error) fail(r.error);
    rv = r.data; // si cambió el texto, el trigger la vuelve a "pending"
  }
  return toEntry(ent, rv);
}

// ---- Reseñas y moderación (funciones RPC: ver supabase/schema.sql)
export async function listReviews(bookId) {
  const {data, error} = await supabase.rpc("book_reviews", {p_book: bookId});
  if (error) fail(error, "No pudimos cargar las reseñas.");
  return data.map(r => ({id: r.id, alias: r.alias || "Lector", rating: r.rating || 0, body: r.body, status: r.status, reason: r.reject_reason || "", mine: r.mine}));
}
export async function listPending() {
  const {data, error} = await supabase.rpc("pending_reviews");
  if (error) fail(error, "No pudimos cargar las reseñas pendientes.");
  return data.map(r => ({id: r.id, bookId: r.book_id, title: r.title, alias: r.alias || "Lector", rating: r.rating || 0, body: r.body}));
}
export async function moderate(id, ok, reason) {
  const {error} = await supabase.rpc("moderate_review", {p_id: id, p_ok: ok, p_reason: reason || null});
  if (error) fail(error, "No pudimos moderar la reseña.");
}
