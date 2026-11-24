import {createClient} from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
// Clave pública (publishable). Si tu proyecto usa las claves anteriores, la "anon" también sirve.
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isConfigured = Boolean(url && key);
export const supabase = isConfigured ? createClient(url, key) : null;
