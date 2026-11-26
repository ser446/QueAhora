begin;

create or replace function public.acreditar_puntos_resena()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
    insert into public.movimientos_puntos (
        usuario_id, tipo_movimiento, concepto, puntos,
        referencia_id, fecha_actividad, clave_operacion,
        cuenta_para_cupo_diario
    )
    select b.usuario_id, 'acreditacion', 'resena', 5,
           new.id, (now() at time zone 'America/Argentina/Buenos_Aires')::date,
           'resena:' || b.usuario_id::text || ':' || b.obra_id::text,
           false
    from public.biblioteca_usuario b
    where b.id = new.biblioteca_id
      and exists (
          select 1 from public.lecturas l
          where l.biblioteca_id = b.id and l.estado = 'terminado'
      )
    on conflict (clave_operacion) where clave_operacion is not null do nothing;

    return new;
end;
$$;

revoke execute on function public.acreditar_puntos_resena() from public, anon, authenticated;

drop trigger if exists acreditar_puntos_resena on public.resenas;
create trigger acreditar_puntos_resena
after insert on public.resenas
for each row execute function public.acreditar_puntos_resena();

commit;
