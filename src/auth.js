// Punto único de autenticación. Las pantallas importan solo este archivo.
// - Con VITE_SUPABASE_URL y la clave pública en .env.local  -> usa Supabase (auth.supabase.js)
// - Sin esas variables                                      -> modo demo local (auth.demo.js)
//
// Contrato (ambas versiones lo cumplen):
//   getUser()                                 -> {id,email,provider} o null
//   onAuthChange((evento, user)=>{})          -> devuelve una función para cancelar la suscripción
//   register({email,password,profile})        -> usuario, o null si falta confirmar el correo
//   login(email, password)                    -> usuario
//   loginWithGoogle()                         -> usuario (demo) o null (Supabase redirige a Google)
//   requestReset(email)                       -> envía el enlace de recuperación
//   resetPassword(email, password)            -> guarda la contraseña nueva
//   logout()
import {isConfigured} from "./supabase.js";
import * as demo from "./auth.demo.js";
import * as real from "./auth.supabase.js";

export const isDemo = !isConfigured;
const impl = isConfigured ? real : demo;
export const {getUser, onAuthChange, register, login, loginWithGoogle, requestReset, resetPassword, logout} = impl;
