begin;

create or replace function public.procesar_ultima_importacion(p_origen text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
    lote public.importaciones%rowtype;
    fila record;
    lector uuid := auth.uid();
    titulo text;
    autor text;
    clave_titulo text;
    clave_autor text;
    isbn10 text;
    isbn13 text;
    isbn text;
    obra uuid;
    edicion uuid;
    autor_id uuid;
    entrada uuid;
    coincidencias uuid[];
    ediciones uuid[];
    estado_lectura text;
    fecha_texto text;
    fecha_fin date;
    partes text[];
    razon text;
    incorporados integer;
    duplicados integer;
    pendientes integer;
    total_errores integer;
begin
    if lector is null then
        raise exception 'Iniciá sesión para procesar tu importación.' using errcode = '42501';
    end if;

    -- Serializa las altas entre importaciones, también para las obras sin ISBN.
    perform pg_catalog.pg_advisory_xact_lock(761528094::bigint);
    select i.* into lote
    from public.importaciones i
    where i.usuario_id = lector and i.origen = p_origen
    order by i.creado_en desc, i.id desc
    limit 1 for update;

    if not found then
        raise exception 'Todavía no tenés un archivo registrado de ese origen.';
    end if;

    for fila in
        select d.id, d.titulo_original, d.autor_original, f.datos
        from public.importacion_detalles d
        join public.importacion_filas_originales f on f.detalle_id = d.id
        where d.importacion_id = lote.id and d.estado = 'pendiente'
        order by d.numero_fila
        for update of d
    loop
        begin
            razon := null;
            fecha_fin := null;
            obra := null;
            edicion := null;
            titulo := nullif(btrim(fila.titulo_original), '');
            autor := nullif(btrim(fila.autor_original), '');
            clave_titulo := lower(regexp_replace(titulo, '[[:space:]]+', ' ', 'g'));
            clave_autor := lower(regexp_replace(autor, '[[:space:]]+', ' ', 'g'));
            isbn := upper(regexp_replace(coalesce(fila.datos->>'ISBN', ''), '[-[:space:]="]', '', 'g'));
            isbn10 := case when isbn ~ '^[0-9]{9}[0-9X]$' then isbn end;
            isbn13 := case when isbn ~ '^[0-9]{13}$' then isbn end;
            if lote.origen = 'goodreads' then
                isbn := regexp_replace(coalesce(fila.datos->>'ISBN13', ''), '[-[:space:]="]', '', 'g');
                isbn13 := coalesce(case when isbn ~ '^[0-9]{13}$' then isbn end, isbn13);
                estado_lectura := case fila.datos->>'Exclusive Shelf'
                    when 'read' then 'terminado' when 'currently-reading' then 'leyendo'
                    when 'to-read' then 'pendiente' end;
                fecha_texto := btrim(fila.datos->>'Date Read');
                partes := regexp_match(fecha_texto, '^([0-9]{4})[-/]([0-9]{1,2})[-/]([0-9]{1,2})$');
            else
                estado_lectura := case fila.datos->>'Estado'
                    when '¡Lo terminé de leer!' then 'terminado' when 'Leyendo ahora' then 'leyendo' end;
                fecha_texto := btrim(split_part(fila.datos->>'Registro de lectura n.º 1 - Período de lectura', '~', 2));
                partes := regexp_match(fecha_texto, '^([0-9]{1,2})/([0-9]{1,2})/([0-9]{4})$');
                if partes is not null then
                    partes := array[partes[3], partes[2], partes[1]];
                end if;
            end if;

            if estado_lectura = 'terminado' and partes is not null then
                begin
                    fecha_fin := make_date(partes[1]::integer, partes[2]::integer, partes[3]::integer);
                exception when datetime_field_overflow then
                    fecha_fin := null;
                end;
            end if;

            if titulo is null or autor is null then
                razon := 'Falta el título o el autor.';
            elsif estado_lectura is null then
                razon := 'Estado de lectura sin equivalencia.';
            elsif estado_lectura = 'terminado' and (
                fecha_fin is null or fecha_fin > (now() at time zone 'America/Argentina/Buenos_Aires')::date
            ) then
                razon := 'Falta una fecha de finalización válida.';
            end if;

            if razon is null then
                select array(select distinct o.id
                    from public.obras o
                    join public.obras_autores oa on oa.obra_id = o.id
                    join public.autores a on a.id = oa.autor_id
                    where lower(regexp_replace(btrim(o.titulo), '[[:space:]]+', ' ', 'g')) = clave_titulo
                      and lower(regexp_replace(btrim(a.nombre), '[[:space:]]+', ' ', 'g')) = clave_autor
                ) into coincidencias;
                select array(select e.id from public.ediciones e
                    where e.isbn_10 = isbn10 or e.isbn_13 = isbn13
                ) into ediciones;

                if cardinality(ediciones) > 1 or cardinality(coincidencias) > 1 then
                    razon := 'Hay más de una coincidencia posible.';
                elsif cardinality(ediciones) = 1 then
                    edicion := ediciones[1];
                    select e.obra_id into obra from public.ediciones e
                    where e.id = edicion and e.estado_verificacion is distinct from 'rechazada';
                    if obra is null or (cardinality(coincidencias) = 1 and coincidencias[1] <> obra)
                       or not exists (
                           select 1 from public.obras_autores oa
                           join public.autores a on a.id = oa.autor_id
                           where oa.obra_id = obra and a.estado_verificacion is distinct from 'rechazada'
                             and lower(regexp_replace(btrim(a.nombre), '[[:space:]]+', ' ', 'g')) = clave_autor
                       ) then
                        razon := 'El ISBN y la obra requieren revisión.';
                    end if;
                else
                    obra := coincidencias[1];
                end if;

                if exists(select 1 from public.obras o where o.id = obra and o.estado_verificacion = 'rechazada') then
                    razon := 'La obra del catálogo requiere revisión.';
                end if;
            end if;

            if razon is not null then
                update public.importacion_detalles set estado = 'requiere_revision', motivo = razon
                where id = fila.id;
                continue;
            end if;

            if obra is null then
                select array(select a.id from public.autores a
                    where lower(regexp_replace(btrim(a.nombre), '[[:space:]]+', ' ', 'g')) = clave_autor
                ) into coincidencias;
                if cardinality(coincidencias) > 1 or exists(
                    select 1 from public.autores a where a.id = coincidencias[1] and a.estado_verificacion = 'rechazada'
                ) then
                    update public.importacion_detalles
                    set estado = 'requiere_revision', motivo = 'La identidad del autor requiere revisión.'
                    where id = fila.id;
                    continue;
                end if;
                autor_id := coincidencias[1];
                if autor_id is null then
                    insert into public.autores (nombre, nombre_normalizado, estado_verificacion)
                    values (autor, clave_autor, 'pendiente') returning id into autor_id;
                end if;
                insert into public.obras (titulo, titulo_normalizado, estado_verificacion)
                values (titulo, clave_titulo, 'pendiente') returning id into obra;
                insert into public.obras_autores (obra_id, autor_id, orden_autoria)
                values (obra, autor_id, 1);
            end if;

            select b.id into entrada from public.biblioteca_usuario b
            where b.usuario_id = lector and b.obra_id = obra;
            if entrada is not null then
                update public.importacion_detalles
                set estado = 'duplicado', obra_id = obra, edicion_id = edicion
                where id = fila.id;
                continue;
            end if;

            if edicion is null and (isbn10 is not null or isbn13 is not null) then
                insert into public.ediciones (obra_id, isbn_10, isbn_13, formato, estado_verificacion)
                values (obra, isbn10, isbn13, 'otro', 'pendiente')
                returning id into edicion;
            end if;

            insert into public.biblioteca_usuario (usuario_id, obra_id, edicion_id, origen)
            values (lector, obra, edicion, lote.origen)
            on conflict (usuario_id, obra_id) do nothing returning id into entrada;

            if entrada is null then
                update public.importacion_detalles
                set estado = 'duplicado', obra_id = obra, edicion_id = edicion
                where id = fila.id;
                continue;
            end if;

            insert into public.lecturas (biblioteca_id, estado, fecha_fin, es_relectura)
            values (entrada, estado_lectura, fecha_fin, false);
            update public.importacion_detalles
            set estado = 'incorporado', obra_id = obra, edicion_id = edicion
            where id = fila.id;
        exception when integrity_constraint_violation or data_exception then
            update public.importacion_detalles
            set estado = 'error', motivo = 'Los datos no cumplen las restricciones del catálogo.'
            where id = fila.id;
        end;
    end loop;

    select count(*) filter (where d.estado = 'incorporado'),
           count(*) filter (where d.estado = 'duplicado'),
           count(*) filter (where d.estado in ('pendiente', 'requiere_revision')),
           count(*) filter (where d.estado = 'error')
    into incorporados, duplicados, pendientes, total_errores
    from public.importacion_detalles d where d.importacion_id = lote.id;

    update public.importaciones
    set estado = case when pendientes + total_errores > 0 then 'parcial' else 'completada' end,
        libros_incorporados = incorporados, duplicados_detectados = duplicados,
        pendientes_revision = pendientes, errores = total_errores,
        ultima_actividad_en = now(), finalizado_en = now()
    where id = lote.id;

    return jsonb_build_object('incorporados', incorporados, 'duplicados', duplicados,
                              'pendientes', pendientes, 'errores', total_errores);
end;
$$;

revoke execute on function public.procesar_ultima_importacion(text) from public, anon;
grant execute on function public.procesar_ultima_importacion(text) to authenticated;

commit;
