begin;

create or replace function public.agregar_libro_biblioteca(
    p_obra_id uuid,
    p_edicion_id uuid default null
)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
declare
    lector_id uuid := auth.uid();
    entrada_id uuid;
begin
    if lector_id is null then
        raise exception 'Iniciá sesión para guardar el libro.' using errcode = '42501';
    end if;

    insert into public.biblioteca_usuario (usuario_id, obra_id, edicion_id, origen)
    values (lector_id, p_obra_id, p_edicion_id, 'manual')
    on conflict (usuario_id, obra_id) do nothing
    returning id into entrada_id;

    if entrada_id is null then
        return false;
    end if;

    insert into public.lecturas (biblioteca_id, estado, es_relectura)
    values (entrada_id, 'pendiente', false);

    return true;
end;
$$;

revoke execute on function public.agregar_libro_biblioteca(uuid, uuid) from public, anon;
grant execute on function public.agregar_libro_biblioteca(uuid, uuid) to authenticated;

create or replace function public.agregar_libro_biblioteca(
    p_obra_id uuid,
    p_edicion_id uuid,
    p_estado text,
    p_fecha_fin date
)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
declare
    lector_id uuid := auth.uid();
    entrada_id uuid;
begin
    if lector_id is null then
        raise exception 'Iniciá sesión para guardar el libro.' using errcode = '42501';
    end if;

    if p_estado is null or p_estado not in ('pendiente', 'leyendo', 'terminado', 'abandonado') then
        raise exception 'Estado de lectura inválido.' using errcode = '22023';
    end if;

    if (p_estado = 'terminado') <> (p_fecha_fin is not null)
       or p_fecha_fin > (now() at time zone 'America/Argentina/Buenos_Aires')::date then
        raise exception 'Indicá una fecha de finalización válida.' using errcode = '22023';
    end if;

    insert into public.biblioteca_usuario (usuario_id, obra_id, edicion_id, origen)
    values (lector_id, p_obra_id, p_edicion_id, 'manual')
    on conflict (usuario_id, obra_id) do nothing
    returning id into entrada_id;

    if entrada_id is null then
        return false;
    end if;

    insert into public.lecturas (biblioteca_id, estado, fecha_fin, es_relectura)
    values (entrada_id, p_estado, p_fecha_fin, false);

    return true;
end;
$$;

revoke execute on function public.agregar_libro_biblioteca(uuid, uuid, text, date) from public, anon;
grant execute on function public.agregar_libro_biblioteca(uuid, uuid, text, date) to authenticated;


commit;
