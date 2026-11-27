begin;

create table if not exists public.importacion_filas_originales (
    detalle_id uuid primary key references public.importacion_detalles(id) on delete cascade,
    datos jsonb not null
);
alter table public.importacion_filas_originales enable row level security;
revoke all on public.importacion_filas_originales from public, anon, authenticated;

create or replace function public.registrar_importacion_biblioteca(
    p_lote_id uuid, p_origen text, p_filas jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
    lector_id uuid := auth.uid();
    lote_id uuid;
begin
    if lector_id is null then
        raise exception 'Iniciá sesión para importar.' using errcode = '42501';
    end if;
    if p_lote_id is null or p_origen is null or p_origen not in ('goodreads', 'bookmory')
       or jsonb_typeof(p_filas) is distinct from 'array' then
        raise exception 'El archivo de importación no es válido.';
    end if;
    if jsonb_array_length(p_filas) = 0 or exists (
        select 1 from jsonb_array_elements(p_filas) as f(fila)
        where jsonb_typeof(f.fila->'datos') is distinct from 'object'
    ) then
        raise exception 'El archivo no contiene filas de importación válidas.';
    end if;

    insert into public.importaciones (id, usuario_id, origen, registros_analizados)
    values (p_lote_id, lector_id, p_origen, jsonb_array_length(p_filas))
    on conflict (id) do nothing
    returning id into lote_id;

    if lote_id is null then
        select i.id into lote_id from public.importaciones i
        where i.id = p_lote_id and i.usuario_id = lector_id and i.origen = p_origen;
        if lote_id is null then
            raise exception 'No pudimos registrar el lote.' using errcode = '42501';
        end if;
        return lote_id;
    end if;

    with filas as (
        select f.ordinalidad::integer as numero_fila, f.fila
        from jsonb_array_elements(p_filas) with ordinality as f(fila, ordinalidad)
    ), detalles as (
        insert into public.importacion_detalles (
            importacion_id, numero_fila, titulo_original, autor_original
        )
        select lote_id, numero_fila, fila->>'titulo', fila->>'autor'
        from filas
        returning id, numero_fila
    )
    insert into public.importacion_filas_originales (detalle_id, datos)
    select d.id, f.fila->'datos'
    from detalles d join filas f using (numero_fila);

    return lote_id;
end;
$$;

revoke execute on function public.registrar_importacion_biblioteca(uuid, text, jsonb) from public, anon;
grant execute on function public.registrar_importacion_biblioteca(uuid, text, jsonb) to authenticated;

commit;
