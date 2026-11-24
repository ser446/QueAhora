import {supabase} from "./supabase.js";

const toUser = u => u ? ({id: u.id, email: u.email, provider: u.app_metadata?.provider || "email"}) : null;

// Esta URL debe estar en Authentication > URL Configuration > Redirect URLs (ver README)
const back = () => location.origin + location.pathname;

const msg = e => {
  if (e.status === 429 || e.code === "over_email_send_rate_limit") return "Hiciste demasiados intentos. Esperá unos minutos y probá de nuevo.";
  if (e.code === "weak_password") return "La contraseña es demasiado débil. Usá una más larga o más variada.";
  if (e.code === "same_password") return "Elegí una contraseña distinta a la anterior.";
  if (e.code === "unexpected_failure" || /database error/i.test(e.message || "")) return "No pudimos crear la cuenta. Revisá los datos (por ejemplo, que el alias no esté en uso).";
  return "No pudimos completar la acción. Probá de nuevo.";
};

export async function getUser() {
  const {data} = await supabase.auth.getSession();
  return toUser(data.session?.user);
}

export function onAuthChange(cb) {
  const {data} = supabase.auth.onAuthStateChange((event, session) => cb(event, toUser(session?.user)));
  return () => data.subscription.unsubscribe();
}

// Los datos del perfil viajan como metadata; el trigger handle_new_user (supabase/schema.sql)
// crea la fila en la tabla "profiles", incluso si todavía falta confirmar el correo.
export async function register({email, password, profile}) {
  const {data, error} = await supabase.auth.signUp({
    email: email.trim(), password,
    options: {data: {...profile}, emailRedirectTo: back()}
  });
  if (error) throw new Error(msg(error));
  return toUser(data.session?.user); // null = falta confirmar el correo
}

export async function login(email, password) {
  const {data, error} = await supabase.auth.signInWithPassword({email: email.trim(), password});
  if (error) {
    if (error.code === "email_not_confirmed") throw new Error("Confirmá tu correo antes de ingresar. Revisá tu bandeja de entrada.");
    if (error.status === 429) throw new Error(msg(error));
    throw new Error("Correo o contraseña incorrectos."); // genérico: no revela si el correo existe
  }
  return toUser(data.user);
}

export async function loginWithGoogle() {
  const {error} = await supabase.auth.signInWithOAuth({provider: "google", options: {redirectTo: back()}});
  if (error) throw new Error(msg(error));
  return null; // el navegador se redirige a Google y vuelve con la sesión iniciada
}

export async function requestReset(email) {
  const {error} = await supabase.auth.resetPasswordForEmail(email.trim(), {redirectTo: back()});
  if (error) throw new Error(msg(error));
  return true;
}

// Se llama con la sesión de recuperación que abre el enlace del correo
export async function resetPassword(_email, password) {
  const {data, error} = await supabase.auth.updateUser({password});
  if (error) throw new Error(msg(error));
  return toUser(data.user);
}

export async function logout() { await supabase.auth.signOut(); }
