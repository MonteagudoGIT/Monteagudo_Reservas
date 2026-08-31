-- Precios de partida (editables luego por el administrador): Sala 10 €, Ping Pong 1 €.

update public.tarifas t
set precio_cent = 1000
from public.espacios e
where t.espacio_id = e.id and e.clave = 'sala' and t.modo = 'sala';

update public.tarifas t
set precio_cent = 100
from public.espacios e
where t.espacio_id = e.id and e.clave = 'sala' and t.modo = 'ping_pong';
