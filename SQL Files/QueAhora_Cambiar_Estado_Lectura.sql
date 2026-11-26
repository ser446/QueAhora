begin;

create or replace function public.cambiar_estado_lectura(
    p_biblioteca_id uuid, p_lectura_id uuid, p_estado_actual text,
    p_estado_nuevo text, p_fecha_fin date
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
    lectura public.lecturas%rowtype;
begin
    if not coalesce(case p_estado_actual
        when 'pendiente' then p_estado_nuevo in ('leyendo', 'terminado', 'abandonado')
        when 'leyendo' then p_estado_nuevo in ('pendiente', 'terminado', 'abandonado')
        when 'abandonado' then p_estado_nuevo in ('pendiente', 'leyendo')
        else false
    end, false) then
        raise exception 'El cambio de estado no está permitido.';
    end if;

    if (p_estado_nuevo = 'terminado') <> (p_fecha_fin is not null)
       or p_fecha_fin > (now() at time zone 'America/Argentina/Buenos_Aires')::date then
        raise exception 'Ingresá una fecha de finalización válida.';
    end if;

    perform 1 from public.biblioteca_usuario as b
    where b.id = p_biblioteca_id and b.usuario_id = auth.uid()
    for update;
    if not found then
        return null;
    end if;

    select l.* into lectura from public.lecturas as l
    where l.biblioteca_id = p_biblioteca_id
    order by l.creado_en desc, l.id
    limit 1 for update;

    if lectura.id is distinct from p_lectura_id
       or coalesce(lectura.estado, 'pendiente') is distinct from p_estado_actual then
        return null;
    end if;

    if p_fecha_fin < lectura.fecha_inicio then
        raise exception 'La fecha de finalización no puede ser anterior al inicio.';
    end if;

    -- Algunas entradas anteriores al alta desde la ficha aún no tienen lectura.
    if lectura.id is null then
        insert into public.lecturas (biblioteca_id, estado, fecha_fin, es_relectura)
        values (p_biblioteca_id, p_estado_nuevo, p_fecha_fin, false)
        returning id into lectura.id;
    else
        update public.lecturas
        set estado = p_estado_nuevo, fecha_fin = p_fecha_fin, actualizado_en = now()
        where id = lectura.id;
    end if;

    return lectura.id;
end;
$$;

revoke execute on function public.cambiar_estado_lectura(uuid, uuid, text, text, date) from public, anon;
grant execute on function public.cambiar_estado_lectura(uuid, uuid, text, text, date) to authenticated;

commit;
