begin;

create or replace function public.abandonar_lectura(p_lectura_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
    update public.lecturas as l
    set estado = 'abandonado', actualizado_en = now()
    from public.biblioteca_usuario as b
    where l.id = p_lectura_id
      and b.id = l.biblioteca_id
      and b.usuario_id = auth.uid()
      and l.estado = 'leyendo';
    return found;
end;
$$;

revoke execute on function public.abandonar_lectura(uuid) from public, anon;
grant execute on function public.abandonar_lectura(uuid) to authenticated;

commit;
