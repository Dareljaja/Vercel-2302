import { MercadoPagoConfig, Preference } from 'mercadopago';
import { createClient } from '@supabase/supabase-js';

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_TOKEN
});

function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

async function reserveStockOrFail(supabase, items) {
  // Reserva stock al iniciar checkout (antes del pago).
  // Esto evita sobreventa aunque el pago aún no esté confirmado.
  for (const it of items) {
    const id = Number(it.id);
    const qty = Math.max(1, parseInt(it.quantity, 10) || 1);
    if (!Number.isFinite(id)) {
      throw new Error('Producto inválido');
    }

    let attempts = 0;
    while (attempts < 3) {
      attempts += 1;
      const { data: row, error: selErr } = await supabase
        .from('productos')
        .select('id, stock, nombre')
        .eq('id', id)
        .single();

      if (selErr) throw new Error(selErr.message || 'No se pudo leer stock');
      const currentStock = row?.stock;
      if (currentStock === null || currentStock === undefined) {
        // Si no se usa stock para este producto, no bloqueamos la compra
        break;
      }
      if (typeof currentStock !== 'number') {
        throw new Error('Stock inválido en producto');
      }
      if (currentStock < qty) {
        const name = row?.nombre ? ` (${row.nombre})` : '';
        throw new Error(`Sin stock suficiente${name}. Disponible: ${currentStock}`);
      }

      const nextStock = currentStock - qty;
      const { data: updated, error: updErr } = await supabase
        .from('productos')
        .update({ stock: nextStock })
        .eq('id', id)
        .eq('stock', currentStock) // control de concurrencia
        .select('id')
        .maybeSingle();

      if (updErr) throw new Error(updErr.message || 'No se pudo actualizar stock');
      if (updated?.id) {
        break; // reservado OK
      }
      // Si no actualizó, otro checkout cambió stock: reintentar
    }
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  if (!process.env.MERCADOPAGO_TOKEN) {
    return res.status(500).json({ error: 'Configura MERCADOPAGO_TOKEN en Vercel' });
  }
  try {
    const input = req.body;
    if (!input.items || !Array.isArray(input.items)) {
      return res.status(400).json({ error: 'No items provided' });
    }

    const items = input.items.map(item => ({
      id: item.id,
      title: item.name,
      description: item.description || '',
      quantity: Math.max(1, parseInt(item.quantity, 10) || 1),
      unit_price: parseFloat(item.price),
      currency_id: 'ARS',
      picture_url: item.image || ''
    }));

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return res.status(500).json({ error: 'Configura SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en Vercel' });
    }

    // Reservar/descontar stock antes de crear la preferencia
    await reserveStockOrFail(supabase, items);

    const preference = new Preference(client).create({
      body: {
        items,
        payer: {
          name: input.payer?.name || 'Comprador',
          email: input.payer?.email || ''
        },
        back_urls: {
          success: `${req.headers.origin || 'https://' + req.headers.host}/success.html`,
          failure: `${req.headers.origin || 'https://' + req.headers.host}/failure.html`,
          pending: `${req.headers.origin || 'https://' + req.headers.host}/pending.html`
        },
        payment_methods: {
          installments: 12
        }
      }
    });

    const response = await preference;
    res.json({
      success: true,
      preference_id: response.body.id,
      init_point: response.body.init_point,
      sandbox_init_point: response.body.sandbox_init_point
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
}
