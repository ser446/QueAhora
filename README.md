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
public/            manifest, service worker e íconos
src/data.js        catálogo de ejemplo y constantes
src/ui.jsx         portada y estrellas
src/App.jsx        estado global y navegación
src/screens/       Home, Library, Search, Book, Log, Profile, AddBook, Moderation, EditProfile
```

## Qué es de ejemplo y qué falta para producción
- Catálogo de 5 libros ficticios + libros cargados a mano (solo visibles en este navegador).
- Moderación de reseñas: pantalla de demostración accesible desde Perfil; en producción debe ser un rol aparte.
- Puntos: 2 por libro leído y 5 por reseña aprobada (regla definida para el prototipo).
- Pendiente (requiere backend): cuentas de usuario, base de datos compartida, moderación real, importación de bibliotecas y datos de Google Books u Open Library.
