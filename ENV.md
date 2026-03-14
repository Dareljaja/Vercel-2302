# Variables de entorno (Vercel)

Configura estas variables en **Vercel → Tu proyecto → Settings → Environment Variables**.

## Supabase (obligatorias para tienda y panel)

| Variable | Descripción | Dónde obtenerla |
|----------|-------------|-----------------|
| `SUPABASE_URL` | URL del proyecto | Supabase → Project Settings → API → Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Clave service_role (admin) | Supabase → Project Settings → API → service_role |

Con solo estas dos, la **tienda** (lista de productos) y el **panel admin** (CRUD productos) funcionan.  
Opcional: si quieres usar la clave anon para la tienda, añade también `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` (la API de productos usará esas si existen).

## Mercado Pago (checkout)

| Variable | Descripción |
|----------|-------------|
| `MERCADOPAGO_TOKEN` | Access Token de tu app en Mercado Pago |

## Opcionales

| Variable | Descripción |
|----------|-------------|
| `JWT_SECRET` | Secreto para el login admin (por defecto se usa uno interno). Cambiar en producción. |

---

Después de añadir o cambiar variables, haz **Redeploy** del proyecto en Vercel.
