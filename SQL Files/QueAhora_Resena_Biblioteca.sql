begin;

create or replace function public.obtener_resena_biblioteca(p_biblioteca_id uuid)
returns table (contenido text, es_publica boolean, contiene_spoilers boolean)
language sql
stable
security definer
set search_path = ''
as $$
    select r.contenido, r.es_publica, r.contiene_spoilers
    from public.resenas r
    join public.biblioteca_usuario b on b.id = r.biblioteca_id
    where b.id = p_biblioteca_id and b.usuario_id = auth.uid();
$$;

create or replace function public.guardar_resena_biblioteca(
    p_biblioteca_id uuid, p_contenido text, p_es_publica boolean,
    p_contiene_spoilers boolean
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
    if p_contenido is null or pg_catalog.regexp_replace(p_contenido, '[[:space:]]', '', 'g') = ''
       or p_es_publica is null or p_contiene_spoilers is null then
        raise exception 'Completá el texto de la reseña.';
    end if;

    perform 1 from public.biblioteca_usuario b
    where b.id = p_biblioteca_id and b.usuario_id = auth.uid()
    for update;

    if not found or not exists (
        select 1 from public.lecturas l
        where l.biblioteca_id = p_biblioteca_id and l.estado = 'terminado'
    ) then
        raise exception 'Solo podés reseñar un libro leído de tu biblioteca.';
    end if;

    update public.resenas
    set contenido = p_contenido, es_publica = p_es_publica,
        contiene_spoilers = p_contiene_spoilers, actualizado_en = now()
    where biblioteca_id = p_biblioteca_id;

    if not found then
        insert into public.resenas (biblioteca_id, contenido, es_publica, contiene_spoilers)
        values (p_biblioteca_id, p_contenido, p_es_publica, p_contiene_spoilers);
    end if;
end;
$$;

revoke execute on function public.obtener_resena_biblioteca(uuid) from public, anon;
grant execute on function public.obtener_resena_biblioteca(uuid) to authenticated;
revoke execute on function public.guardar_resena_biblioteca(uuid, text, boolean, boolean) from public, anon;
grant execute on function public.guardar_resena_biblioteca(uuid, text, boolean, boolean) to authenticated;

commit;
