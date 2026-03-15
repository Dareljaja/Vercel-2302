-- Agregar columna de precio de oferta a productos (para "En oferta especial").
-- Ejecutá esto en Supabase → SQL Editor si ya tenés la tabla productos.

alter table public.productos
  add column if not exists precio_oferta numeric(12,2) default null;

comment on column public.productos.precio_oferta is 'Precio mostrado cuando offer = true; el precio normal se muestra tachado.';
