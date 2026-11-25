-- Guardar solo la ruta del archivo en la edición.
-- Los originales se cargan desde el panel de Supabase Storage.
begin;

alter table public.ediciones add column if not exists tapa_ruta text;

insert into storage.buckets (id, name, public, allowed_mime_types)
values ('tapas-libros', 'tapas-libros', true, array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

commit;
