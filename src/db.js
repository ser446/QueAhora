// Punto único de acceso a datos (libros, lecturas, reseñas, perfiles). Mismo esquema que auth.js:
// con Supabase configurado usa db.supabase.js; si no, el modo demo local (db.demo.js).
//
// Contrato (ambas versiones lo cumplen):
//   listBooks()                      -> [{id,t,a,p,g,isbn,r,c}]
//   addBook(userId,{t,a,p,g,isbn})   -> libro
//   getProfile(userId)               -> {nombre,apellido,alias,pais,provincia,localidad,role} o null
//   saveProfile(userId, campos)      -> perfil guardado (error si el alias ya está en uso)
//   aliasAvailable(alias)            -> true/false
//   listEntries(userId)              -> lecturas del usuario (con su reseña y estado)
//   addEntry(userId, bookId)         -> lectura
//   saveEntry(userId, lectura)       -> lectura guardada (la reseña nueva o editada queda "pending")
//   listReviews(bookId, userId)      -> reseñas aprobadas + las propias
//   listPending()                    -> reseñas pendientes (solo admin)
//   moderate(reviewId, ok, motivo)   -> aprueba o rechaza (solo admin)
import {isConfigured} from "./supabase.js";
import * as demo from "./db.demo.js";
import * as real from "./db.supabase.js";

const impl = isConfigured ? real : demo;
export const {listBooks, addBook, getProfile, saveProfile, aliasAvailable, listEntries, addEntry, saveEntry, listReviews, listPending, moderate} = impl;

export const listFeaturedBooks = isConfigured
  ? real.listFeaturedBooks
  : async () => (await demo.listBooks()).slice(0, 2);

export const searchCatalogBooks = real.searchCatalogBooks;
export const getCatalogBook = real.getCatalogBook;
export const listCatalogLibrary = real.listCatalogLibrary;
export const addCatalogBook = real.addCatalogBook;
export const abandonCatalogReading = real.abandonCatalogReading;
export const changeCatalogReadingStatus = real.changeCatalogReadingStatus;
export const getCatalogReview = real.getCatalogReview;
export const saveCatalogReview = real.saveCatalogReview;
export const listPublicCatalogReviews = real.listPublicCatalogReviews;
export const registerLibraryImport = real.registerLibraryImport;
export const processLatestLibraryImport = real.processLatestLibraryImport;
export const listLatestLibraryImports = real.listLatestLibraryImports;
export const listLibraryImportReviewRows = real.listLibraryImportReviewRows;
