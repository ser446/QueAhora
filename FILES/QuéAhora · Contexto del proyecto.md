# QuéAhora? · Contexto del proyecto

*Documento de referencia para la base de conocimiento. Versión 1.0 · noviembre de 2026. Describe el estado del proyecto tras la reorganización con login, perfiles, roles y preparación para Supabase.*

## 1. Qué es QuéAhora?

App web progresiva (PWA), pensada primero para celular, para personas lectoras de Argentina (el diseño de referencia usa Buenos Aires). Permite:

- Descubrir y buscar libros (por título, autor o ISBN).
- Armar una biblioteca personal con tres estados: *Quiero leer*, *Leyendo* y *Leído*.
- Registrar cada lectura con fecha de finalización, formatos, calificación y reseña opcional.
- Publicar reseñas para todos los lectores, previa aprobación manual de un administrador.
- Sumar puntos por leer y reseñar (los canjes en comercios participantes son una etapa futura).

Origen: el archivo `QueAhora_bosquejo_v01.html`, con 5 pantallas de referencia (Inicio, Biblioteca, Ficha del libro, Registrar lectura, Perfil). El diseño fue aprobado por el dueño del proyecto (Sergio). Los datos y portadas de ejemplo son ficticios.

## 2. Stack y dependencias

- **Vite 5 + React 18**, JavaScript (sin TypeScript), sin router y sin librería de UI. CSS propio en un solo archivo.
- **PWA manual:** `manifest.webmanifest` + `public/sw.js` (sin plugin).
- **Supabase** (autenticación + Postgres) con **modo demo** local cuando no hay claves.
- Dependencias: `react`, `react-dom`, `@supabase/supabase-js` (^2.45). Desarrollo: `vite` (^5.4.8), `@vitejs/plugin-react` (^4.3.1).
- Scripts: `npm run dev` (desarrollo), `npm run build`, `npm run preview` (prueba de la PWA con service worker).

### Entorno de desarrollo del usuario

- Windows con PowerShell. Evitar tener el proyecto dentro de **OneDrive**: bloquea archivos de `node_modules` y provoca errores EPERM. Ruta sugerida: `C:\Projects\QueAhora`.
- `npm audit` informa 2 vulnerabilidades de Vite/esbuild que afectan al servidor de desarrollo, no a la app publicada. **No usar `npm audit fix --force`** (sube Vite de versión mayor sin avisar). Subir a Vite 6 solo de forma deliberada y probándolo.

## 3. Estructura del proyecto

```
public/              manifest.webmanifest, sw.js, icons/ (192, 512, maskable, apple-touch, favicon.svg)
supabase/schema.sql  tablas, RLS, triggers y funciones (se ejecuta una vez en el SQL Editor)
index.html           meta theme-color, manifest, íconos
vite.config.js       base "./" (funciona en cualquier carpeta o dominio)
.env.example         VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY
src/
  main.jsx           monta App y registra el service worker (solo en producción)
  App.jsx            estado global, navegación, reglas de acceso, acciones
  data.js            constantes (puntos, estados, formatos), catálogo en memoria
  ui.jsx             componentes compartidos: Cover, Stars
  styles.css         todos los estilos y tokens de diseño
  supabase.js        crea el cliente si hay claves (isConfigured)
  auth.js            punto único de autenticación -> auth.supabase.js | auth.demo.js
  db.js              punto único de datos        -> db.supabase.js   | db.demo.js
  demo.store.js      "base de datos" local del modo demo (localStorage)
  screens/           Home, Library, Search, Book, Log, AddBook, Profile,
                     Auth (login), ProfileForm (crear usuario y editar perfil), Moderation (admin)
```

## 4. Arquitectura y convenciones de código

### Capas de acceso

- Las pantallas **nunca** importan `supabase.js` ni los archivos `*.demo.js` / `*.supabase.js`: solo `auth.js` y `db.js`.
- Cada selector elige la implementación según `isConfigured` (hay claves en `.env.local`). **Ambas implementaciones deben cumplir el mismo contrato**, documentado al inicio de `auth.js` y `db.js`. Cualquier función nueva se agrega en las dos.
- Las funciones lanzan `Error` con un mensaje **ya redactado en español para mostrar a la persona**; App muestra el mensaje en un toast.

### Estado y navegación

- Todo el estado vive en `App.jsx` con `useState` (sin Redux ni Context): `user`, `profile`, `books`, `entries`, `scr`, `toast`.
- Navegación por estado: `go(nombre, params)`. Pantallas: `home`, `library`, `search`, `book`, `log`, `add`, `login`, `register`, `edit`, `profile`, `mod`.
- Pantallas privadas (`library`, `log`, `add`, `edit`) redirigen a Login con un aviso si no hay sesión. `mod` solo se abre si `profile.role === "admin"`.
- El catálogo en memoria se publica con `setCatalog(books)` y se consulta con `bk(id)` (que devuelve un libro de respaldo si todavía no cargó).

### Formas de datos en el cliente

| Objeto | Campos |
| --- | --- |
| Libro | `{id, t (título), a (autor), p (páginas), g (género), isbn, r (promedio, 0 = sin calificaciones), c (índice de color de portada)}` |
| Lectura | `{id, bookId, status, formats[], date, rating, review, rs, reason}` |
| Perfil | `{nombre, apellido, alias, pais, provincia, localidad, role}` |
| Usuario | `{id, email, provider}` |

`rs` es el estado de la reseña: `none`, `pending`, `approved` o `rejected`; `reason` es el motivo del rechazo.

### Estilo

- Componentes funcionales; cada pantalla es `export default function`. Código compacto en JSX, sin TypeScript.
- Comentarios y mensajes en español. Datos de perfil en español (`nombre`, `apellido`, `pais`...), columnas de base de datos en `snake_case`, nombres técnicos en inglés.
- Textos de la interfaz en **español rioplatense con voseo** ("Ingresá", "Registrate", "Elegí", "Tenés").
- Tipografía tipográfica en los textos: apóstrofe ’ y comillas “ ”.
- Formularios con `<form onSubmit>` y `noValidate`; validación en el cliente más validación en la base de datos.
- Accesibilidad: `aria-label` en campos, `role="alert"` para errores y `role="status"` para avisos, `aria-pressed` en chips alternables, foco visible con contorno coral.
- Seguridad en mensajes: el login responde siempre «Correo o contraseña incorrectos»; la recuperación no revela si la cuenta existe.
- No usar `localStorage` salvo en el modo demo (`qa-demo-db-v2`, `qa-session`).

## 5. Tokens de diseño

### Colores (variables CSS en `:root`)

| Token | Claro | Oscuro | Uso |
| --- | --- | --- | --- |
| `--teal` | `#177e89` | igual | color de marca, encabezados, enlaces |
| `--coral` | `#ff795e` | igual | botón principal (texto `#2c2630`), foco |
| `--cream` | `#f8f6f0` | `#172029` | fondo de la app |
| `--ink` | `#243247` | `#e8edf0` | texto principal |
| `--card` | `#ffffff` | `#222d38` | tarjetas y campos |
| `--line` | `#e0e4e6` | `#33414d` | bordes y divisores |
| `--muted` | `#687681` | `#9aa8b2` | texto secundario |
| `--chip` | `#e1f3f0` | `#1e3b40` | fondo de chips |
| `--chipink` | `#12636b` | `#8fd3da` | texto de chips |
| `--page` | `#e9edf0` | `#0e1419` | fondo detrás del teléfono |
| `--frame` | `#283342` | `#3a4856` | marco del teléfono |
| `--star` | `#e0ae37` | `#f0c45a` | estrellas |
| `--err` | `#c0392b` | `#ff8a73` | errores |

El modo oscuro sigue la preferencia del sistema (`prefers-color-scheme`). El bosquejo definía también un dorado `#e8c86b` que hoy no se usa.

### Portadas ilustradas (degradados por índice `id mod 5`)

`c0` #316e83 → #1f3548 · `c1` #d68a64 → #804956 · `c2` #6e8c68 → #314f45 · `c3` #8a6fa8 → #43315e · `c4` #c9a24b → #7a5a1e. Texto blanco en Georgia (serif) y en mayúsculas.

### Tipografía, formas y espacios

- Familia: `system-ui, -apple-system, "Segoe UI", sans-serif`; portadas en `Georgia, serif`.
- Título de pantalla 22 px; secciones en negrita 750; notas y chips 12 px (chips en peso 650); botones 15 px en peso 750.
- Radios: tarjetas 14 px, campos 11 px, botones 12 px, chips 20 px, marco del teléfono 32 px.
- Marco de teléfono: ancho 360 px, borde 8 px, alto `min(740px, 100vh)`. En pantallas de 420 px o menos, ocupa toda la pantalla sin marco.
- Contenido con padding `16px 18px 20px`; separaciones habituales de 10 px; barra inferior de 62 px más el área segura (`env(safe-area-inset-bottom)`).
- Barra inferior: `⌂ Inicio`, `▤ Biblioteca`, `⌕ Buscar`, `◯ Perfil` (invitado: `→ Login`) y, solo para administradores, `✓ Moderar`.
- Toast: aparece 2,6 s sobre la barra inferior.

### Clases reutilizables

`.top` (encabezado teal), `.content`, `.nav`, `.search`, `.section`, `.row`, `.book`, `.cover` / `.mini`, `.chip` / `.chip.active`, `.btn`, `.listbook`, `.stat`, `.review`, `.note`, `.label`, `.field`, `.stars`, `.item`, `.toast`, `.gbtn` (Google), `.or`, `.link`, `.err`, `.pw` (campo con botón Mostrar/Ocultar).

## 6. Reglas de negocio

### Roles y permisos

| Acción | Invitado | Usuario | Admin |
| --- | --- | --- | --- |
| Ver Inicio, Buscar, ficha de libro y reseñas aprobadas | Sí | Sí | Sí |
| Biblioteca, agregar libros a la biblioteca, registrar lecturas | Redirige a Login | Sí | Sí |
| Cargar un libro nuevo al catálogo | No | Sí | Sí |
| Escribir reseñas | No | Sí (quedan en revisión) | Sí |
| Moderar reseñas (pestaña «Moderar») | No | No | Sí |

La pantalla de moderación **no aparece en el perfil de nadie**: los administradores la abren desde su propia pestaña. El control está en la app y también en la base de datos (`is_admin()`).

### Lecturas

- Estados: *Quiero leer*, *Leyendo*, *Leído*.
- **Un solo registro por libro y por persona** (no hay relecturas): una sola fecha de finalización, que solo aplica al estado *Leído*.
- **Formatos múltiples** (Físico, Digital, Audio); siempre debe quedar al menos uno marcado.
- Calificación de 1 a 5 estrellas, opcional.

### Reseñas y moderación

- Estados: `pending`, `approved`, `rejected`.
- Una reseña nueva, o con el texto cambiado, **siempre vuelve a `pending`**. Cambiar solo la calificación no altera el estado. Una reseña vacía se elimina. Máximo 2000 caracteres (lo exige la base de datos).
- Solo las `approved` son públicas. Su autor ve las suyas en cualquier estado, con la etiqueta «En revisión» o con el motivo del rechazo.
- Rechazar exige un motivo (opciones rápidas: «Lenguaje ofensivo», «Spoilers sin aviso», «No es una reseña», o texto libre). La persona puede corregir y reenviar.
- La moderación es **manual**. A futuro se sumará un filtro automático que apruebe lo claro y derive lo dudoso al equipo: el flujo ya está pensado como una etapa de revisión.

### Puntos

- **3 puntos por libro en estado Leído** y **2 puntos por reseña aprobada** (los puntos de la reseña se suman al aprobarse, no al escribirla).
- Los valores están en `src/data.js` (`PTS_LIBRO`, `PTS_RESENA`); el cálculo y todos los textos usan esas constantes. **No escribir los números a mano en ningún texto.**
- El total se calcula en el cliente (`App.jsx`). Los canjes con comercios participantes son una etapa futura.

### Usuarios y perfil

- Campos obligatorios: Nombre, Apellido, Alias, País, Provincia, Localidad. Para crear la cuenta además: correo (es el «usuario» para ingresar) y contraseña de 8 caracteres o más, repetida.
- **Alias único** (sin distinguir mayúsculas), de 3 a 20 caracteres: letras, números, punto, guion y guion bajo. Es el nombre público en las reseñas.
- Quien ingresa con Google debe completar su perfil la primera vez (la app lo redirige a «Editar perfil»).
- «Editar perfil y ubicación» usa la misma pantalla que crear usuario (`ProfileForm`), con los datos cargados y el correo solo de lectura.
- El rol (`user` / `admin`) nunca se puede cambiar desde la app.

### Catálogo

- Catálogo compartido: cualquier usuario puede cargar un libro (título y autor obligatorios).
- Calificación promedio de un libro: promedio de las calificaciones de las lecturas de todos los usuarios.
- Pendientes: completar datos por ISBN desde Google Books u Open Library, e importar la biblioteca de otros servicios (el botón muestra «Próximamente»).

## 7. Autenticación

- Correo y contraseña, ingreso con Google, registro con confirmación de correo (recomendada), recuperación de contraseña.
- Los datos del perfil viajan como metadata en `signUp`; el trigger `handle_new_user` crea la fila en `profiles` aun si falta confirmar el correo. El alias se verifica antes con `alias_available`.
- Recuperación: el enlace del correo vuelve a la app, Supabase emite el evento `PASSWORD_RECOVERY` y se abre la pantalla «Nueva contraseña».
- La URL de retorno (`origin + pathname`) debe estar en **Authentication > URL Configuration > Redirect URLs** (incluir `http://localhost:5173/**` y el dominio publicado).
- Google: credencial OAuth de tipo «Aplicación web» en Google Cloud; la URI de redirección autorizada es la URL de callback que muestra Supabase (`https://<proyecto>.supabase.co/auth/v1/callback`).
- Para producción: SMTP propio (el correo incluido en Supabase tiene límites) y plantillas de correo en español.
- Variables de entorno: `VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY` (también sirve la clave `anon`). **Nunca** usar claves `service_role` o secretas en la app. Vite incorpora las variables al compilar: tras cambiarlas hay que volver a generar el build.

## 8. Base de datos (Supabase)

Se crea con `supabase/schema.sql`. Tablas y reglas:

- **profiles** (`id` = usuario de auth, nombre, apellido, alias único, país, provincia, localidad, `role`). Cada persona ve y edita solo su fila; el admin ve todas. Solo las columnas de datos personales son editables (el rol está protegido por permisos de columna).
- **books** (título, autor, páginas, género, ISBN, `created_by`). Lectura pública; inserta cualquier usuario autenticado a su nombre; edita solo el admin. Incluye 5 libros de ejemplo.
- **reading\_entries** (usuario, libro, estado, formatos\[\], fecha, calificación). Única por (usuario, libro). Solo su dueño la ve y modifica.
- **reviews** (usuario, libro, texto, calificación, estado, motivo del rechazo, moderador, fecha). Única por (usuario, libro). Cada persona maneja solo las suyas.
- **Triggers:** `handle_new_user` (crea el perfil) y `reviews_guard` (fuerza `pending` en reseñas nuevas o editadas; impide que alguien se apruebe a sí mismo).
- **Funciones (RPC):** `is_admin()`, `alias_available(a)`, `books_with_stats()`, `book_reviews(p_book)`, `pending_reviews()` y `moderate_review(p_id, p_ok, p_reason)` (estas dos últimas, solo admin).
- Para nombrar al primer administrador: ejecutar en el SQL Editor `update public.profiles set role = 'admin' where id = (select id from auth.users where email = 'tu@correo.com');`

## 9. Modo demo

- Se activa solo cuando no hay claves de Supabase. Cuentas, perfiles, libros, lecturas y reseñas se guardan en `localStorage` del navegador (clave `qa-demo-db-v2`; sesión en `qa-session`).
- Todas las cuentas del demo comparten ese «servidor» local, lo que permite probar la moderación entre usuarios.
- Administrador en el demo: registrarse con el correo `admin@queahora.demo`. Para reiniciar el demo, borrar esas dos claves en F12 > Application > Local Storage.
- La contraseña se guarda con hash SHA-256 y sal: es solo para probar, **no es seguro y no debe usarse en producción**.

## 10. PWA

- `manifest.webmanifest`: nombre «QuéAhora?», `display: standalone`, colores `#f8f6f0` (fondo) y `#177e89` (tema), íconos 192, 512 y maskable.
- `sw.js`: precarga el esqueleto; para navegación usa red primero con respaldo en caché; para archivos usa caché con actualización en segundo plano. Solo se registra en producción.
- **Al publicar cambios, subir el número de `CACHE` en `public/sw.js`** (hoy `queahora-v2`) para que las personas reciban la versión nueva.
- Requiere HTTPS al publicar (Netlify, Vercel, Firebase Hosting, Cloudflare Pages o GitHub Pages). Para probar la instalación y el modo sin conexión: `npm run build` + `npm run preview`.

## 11. Decisiones tomadas

- Un solo registro por libro (sin relecturas) y formatos múltiples.
- Reseñas públicas solo tras aprobación manual; puntos de reseña al aprobar.
- Moderación accesible solo para admins, mediante pestaña propia y no desde el perfil.
- El «usuario» para ingresar es el correo electrónico; el alias es el nombre público.
- Los invitados pueden explorar el catálogo y las reseñas sin cuenta.
- Proveedor de autenticación y datos: **Supabase** (elegido sobre Firebase).

## 12. Estado actual y pendientes

**Hecho y probado en modo demo** (pruebas automáticas en navegador): invitado, registro, edición de perfil, alias duplicado, login/logout, reseñas en revisión, moderación por admin y suma de puntos.

**Preparado pero no probado contra un proyecto real de Supabase:** `auth.supabase.js`, `db.supabase.js` y `supabase/schema.sql`. Es lo primero que conviene verificar al conectar (errores de políticas RLS, redirecciones, correo de confirmación).

**Pendientes**

- Conectar y probar contra un proyecto de Supabase real; configurar Google y SMTP.
- Completar datos por ISBN con Google Books u Open Library.
- Importar bibliotecas de otros servicios.
- Decidir si se permite ingresar con alias además del correo (requiere una consulta adicional).
- Filtro automático de reseñas combinado con la revisión manual.
- Canjes de puntos con comercios participantes.
- Compilar y probar en Vite 6 si se quieren eliminar los avisos de `npm audit`.

## 13. Cómo trabajar con Claude en este proyecto

- **Idioma:** responder en español. La interfaz usa voseo; las respuestas al dueño del proyecto vienen usando tuteo.
- **Preguntas:** hacer 1 o 2 preguntas clave solo cuando sean necesarias; preferir avanzar con supuestos explícitos.
- **Entregables:** al modificar el código, entregar un zip con **solo los archivos modificados o nuevos** (con sus rutas) y avisar qué archivos borrar. Entregar el proyecto completo solo si el cambio es una reorganización grande o se pide.
- **Constantes:** cambios de puntos solo en `src/data.js`; no repetir números en textos.
- **Contratos:** toda función nueva de datos o autenticación se agrega en las dos implementaciones (demo y Supabase) y se documenta en `auth.js` / `db.js`.
- **Verificación:** antes de entregar, compilar y probar el flujo en modo demo con un navegador automatizado; ser claro con lo que **no** se pudo probar (por ejemplo, Supabase real).
- **Seguridad:** nunca incluir claves secretas; mantener las reglas en la base de datos (RLS), no solo en la interfaz.
- **Prototipo publicado:** https://claude.ai/artifact/V6rFJmY6JrQ2Kxe5CGgxne es una versión demo **anterior** a la reorganización (sin perfiles ni roles). Sirve solo como referencia visual; la fuente de verdad es el proyecto Vite.
