begin;

create or replace function public.resena_tiene_minimo_de_palabras(p_contenido text)
returns boolean
language sql
immutable
set search_path = ''
as $$
    select count(*) >= 20
    from pg_catalog.regexp_matches(p_contenido, '[[:alpha:]]+', 'g');
$$;

-- Valida escrituras futuras sin modificar reseñas ni puntos existentes.
alter table public.resenas drop constraint if exists resenas_minimo_palabras;
alter table public.resenas add constraint resenas_minimo_palabras
    check (public.resena_tiene_minimo_de_palabras(contenido)) not valid;

create or replace function public.listar_resenas_publicas(p_obra_id uuid)
returns table (id uuid, alias text, contenido text, contiene_spoilers boolean)
language sql
stable
security definer
set search_path = ''
as $$
    select r.id, u.alias::text, r.contenido, r.contiene_spoilers
    from public.resenas r
    join public.biblioteca_usuario b on b.id = r.biblioteca_id
    left join public.usuarios u on u.id = b.usuario_id
    where b.obra_id = p_obra_id and r.es_publica is true
      and public.resena_tiene_minimo_de_palabras(r.contenido)
    order by r.creado_en desc, r.id;
$$;

revoke execute on function public.listar_resenas_publicas(uuid) from public;
grant execute on function public.listar_resenas_publicas(uuid) to anon, authenticated;

commit;
