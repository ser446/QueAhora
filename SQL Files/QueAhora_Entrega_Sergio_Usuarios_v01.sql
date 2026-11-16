-- QuéAhora? Lectores | Estado REAL ejecutado en Supabase | 12-11-2026
-- Proyecto: queahora-lectores-dev | PostgreSQL / Supabase Auth
-- DOCUMENTACIÓN REPRODUCIBLE: no ejecutar de nuevo sobre el proyecto actual
-- sin revisar primero: la tabla y las políticas YA EXISTEN.
-- No confundir con el borrador previo QueAhora_Usuarios_v01.sql:
-- aquel proponía public.profiles y otras tablas, pero NO se ejecutó.

CREATE TABLE public.perfiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  alias TEXT NOT NULL UNIQUE,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT alias_longitud CHECK (char_length(trim(alias)) BETWEEN 3 AND 30)
);
ALTER TABLE public.perfiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuario consulta su perfil"
ON public.perfiles FOR SELECT TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Usuario crea su perfil"
ON public.perfiles FOR INSERT TO authenticated
WITH CHECK (auth.uid() = id);

CREATE POLICY "Usuario modifica su perfil"
ON public.perfiles FOR UPDATE TO authenticated
USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- PRUEBAS REALIZADAS:
-- 1. Confirmada existencia de auth.users.
-- 2. Ejecutada creación de tabla y RLS, sin errores.
-- 3. Ejecutadas las tres políticas, sin errores.
-- 4. Creado un usuario de prueba desde Authentication > Users,
--    confirmado manualmente desde el panel administrativo.
-- 5. Insertado perfil con alias LectorPrueba01 desde SQL Editor.
-- 6. Confirmada su existencia en Table Editor.
-- ATENCIÓN: la inserción administrativa no demuestra que las políticas RLS
-- funcionen desde una sesión normal de usuario. Eso falta probar.

-- PENDIENTES ANTES DE CONECTAR REGISTRO REAL:
-- A. Probar signUp/signIn desde cliente con clave pública (publishable key).
-- B. Probar SELECT/INSERT/UPDATE con JWT de usuario autenticado.
-- C. Definir creación automática o desde app del perfil tras registro,
--    contemplando confirmación de email y fallos parciales.
-- D. Asegurar unicidad de alias sin distinguir mayúsculas/minúsculas.
-- E. Revisar permisos GRANT, exposición API y políticas de privacidad.
-- F. No guardar roles administrativos editables en public.perfiles.
-- G. Añadir residencia, avatar, cumpleaños y consentimiento en migraciones.
-- H. Verificar restricciones de acceso y columnas antes de producción.
-- I. Versionar futuras migraciones SQL en repositorio GitHub de Sergio.
-- Nunca colocar contraseña de base de datos ni service_role/secret key en React.
