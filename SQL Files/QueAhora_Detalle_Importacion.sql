begin;

create or replace function public.listar_filas_para_revisar(p_importacion_id uuid)
returns table (
    numero_fila integer, titulo_original text, autor_original text, motivo text
)
language sql
stable
security definer
set search_path = ''
as $$
    select d.numero_fila, d.titulo_original, d.autor_original, d.motivo
    from public.importacion_detalles d
    join public.importaciones i on i.id = d.importacion_id
    where i.id = p_importacion_id
      and i.usuario_id = auth.uid()
      and d.estado = 'requiere_revision'
    order by d.numero_fila;
$$;

revoke execute on function public.listar_filas_para_revisar(uuid) from public, anon;
grant execute on function public.listar_filas_para_revisar(uuid) to authenticated;

commit;
