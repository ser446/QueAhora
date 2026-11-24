# QuéAhora? · PWA (Vite + React)

Prototipo funcional de la app, listo para instalar en el celular como PWA.
Los datos (libros, lecturas, reseñas, perfil) se guardan **solo en el navegador** (localStorage).

## Requisitos
- Node.js 18 o superior

## Comandos
```bash
npm install        # instala dependencias
npm run dev        # desarrollo en http://localhost:5173
npm run build      # genera la carpeta dist/
npm run preview    # prueba la versión final (con service worker)
```

## Probar la instalación y el modo sin conexión
1. `npm run build` y luego `npm run preview`.
2. Abrí la URL en Chrome o Edge. Debería aparecer la opción «Instalar app».
3. Con la app abierta, cortá internet (o DevTools → Network → Offline) y recargá: sigue funcionando.

El service worker solo se activa en la versión de producción, no en `npm run dev`.

## Publicar
Subí el contenido de `dist/` a Netlify, Vercel, Firebase Hosting, Cloudflare Pages o GitHub Pages.
Una PWA necesita **HTTPS** (todos esos servicios lo incluyen). La app usa rutas relativas, así que funciona en un dominio o en una subcarpeta.
Al publicar cambios, subí el número de `CACHE` en `public/sw.js` (por ejemplo `queahora-v2`) para que los usuarios reciban la versión nueva.

## Estructura
```
public/              manifest, service worker e íconos
supabase/schema.sql  tablas, seguridad (RLS) y funciones para Supabase
src/data.js          constantes (puntos, estados, formatos) y catálogo en memoria
src/auth.js          punto único de autenticación  -> auth.supabase.js | auth.demo.js
src/db.js            punto único de datos          -> db.supabase.js   | db.demo.js
src/App.jsx          estado global, navegación y reglas de acceso
src/screens/         Home, Library, Search, Book, Log, Profile, AddBook,
                     Auth (login), ProfileForm (crear usuario y editar perfil), Moderation (admin)
```

## Quién puede qué
- **Invitado (sin ingresar):** ve Inicio, Buscar y la ficha de los libros y sus reseñas. La pestaña dice **Login**. Biblioteca, agregar libros y registrar lecturas lo llevan a Login.
- **Usuario:** la pestaña dice **Perfil**. Maneja su biblioteca, escribe reseñas (quedan en revisión) y edita su perfil.
- **Administrador:** además ve la pestaña **Moderar** (la pantalla de moderación no aparece en el perfil de nadie). El acceso se controla en la app y también en la base de datos (`is_admin()`).

## Qué es de ejemplo y qué falta para producción
- Sin Supabase, la app funciona en modo demo: catálogo de 5 libros ficticios y datos guardados solo en este navegador.
- Moderación de reseñas: pantalla de demostración accesible desde Perfil; en producción debe ser un rol aparte.
- Puntos: 3 por libro leído y 2 por reseña aprobada (regla definida para el prototipo).
- Pendiente: importación de bibliotecas y datos de Google Books u Open Library.

## Autenticación con Supabase
La app arranca en **modo demo** (cuentas locales en el navegador) hasta que configures Supabase. Con las claves cargadas, usa Supabase de verdad: ingreso con correo y contraseña, registro con confirmación por correo, recuperación de contraseña e ingreso con Google.

1. Creá un proyecto en [supabase.com](https://supabase.com).
2. En **Project Settings > API** copiá la *Project URL* y la clave pública (`sb_publishable_...`; si tu proyecto usa las claves anteriores, la `anon` también sirve). Copiá `.env.example` como `.env.local`, pegá los valores y reiniciá `npm run dev`. **Nunca** pongas en la app una clave secreta o `service_role`.
3. En **Authentication > URL Configuration**: poné como *Site URL* la dirección donde publicás la app y en *Redirect URLs* agregá `http://localhost:5173/**` y `https://TU-DOMINIO/**`. Sin esto, la confirmación de correo, la recuperación y Google no vuelven a la app.
4. **Correo y contraseña** viene activado. Recomendamos dejar la confirmación de correo encendida y exigir al menos 8 caracteres de contraseña. Si apagás la confirmación, quien se registra entra directo.
5. **Google**: en Google Cloud Console creá un *ID de cliente OAuth* de tipo «Aplicación web» (y configurá la pantalla de consentimiento). En *URI de redirección autorizados* pegá la URL de callback que Supabase muestra en **Authentication > Providers > Google** (formato `https://TU-PROYECTO.supabase.co/auth/v1/callback`). Copiá el Client ID y el Client Secret a ese mismo panel de Supabase y activá el proveedor.
6. **Correos**: el servicio de correo incluido en Supabase sirve para probar pero tiene límites. Para producción conectá un SMTP propio y traducí las plantillas en **Authentication > Email Templates**.
7. Al publicar, cargá las mismas variables `VITE_...` en tu hosting y volvé a generar el build (Vite las incorpora al compilar).

Todo el acceso pasa por `src/auth.js`, que elige entre `auth.supabase.js` y `auth.demo.js`.

## Base de datos en Supabase
1. En **SQL Editor** pegá y ejecutá `supabase/schema.sql`. Crea perfiles (nombre, apellido, alias, país, provincia, localidad y rol), libros, lecturas y reseñas con moderación, con sus reglas de seguridad.
2. Registrate desde la app y luego convertite en administrador/a ejecutando en el SQL Editor la línea que está al final de `schema.sql` (con tu correo).
3. Los alias son únicos (sin distinguir mayúsculas). Quien ingresa con Google debe completar su perfil la primera vez.
4. Las reseñas nuevas o editadas quedan **pending**; solo un admin puede aprobarlas o rechazarlas (la base de datos lo exige, no solo la app).
