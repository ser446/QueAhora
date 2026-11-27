begin;

create or replace function public.listar_ultimas_importaciones()
returns table (
    id uuid, origen text, registros_analizados integer, por_procesar boolean,
    libros_incorporados integer, duplicados_detectados integer,
    pendientes_revision integer, errores integer
)
language sql
stable
security definer
set search_path = ''
as $$
    select distinct on (i.origen)
        i.id, i.origen, i.registros_analizados,
        exists (
            select 1 from public.importacion_detalles d
            join public.importacion_filas_originales f on f.detalle_id = d.id
            where d.importacion_id = i.id and d.estado = 'pendiente'
        ),
        i.libros_incorporados, i.duplicados_detectados, i.pendientes_revision, i.errores
    from public.importaciones i
    where i.usuario_id = auth.uid() and i.origen in ('goodreads', 'bookmory')
    order by i.origen, i.creado_en desc, i.id desc;
$$;

revoke execute on function public.listar_ultimas_importaciones() from public, anon;
grant execute on function public.listar_ultimas_importaciones() to authenticated;

commit;
