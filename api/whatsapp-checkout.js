import { createClient } from '@supabase/supabase-js';

function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

async function reserveStockOrFail(supabase, items) {
  for (const it of items) {
    const id = Number(it.id);
    const qty = Math.max(1, parseInt(it.quantity, 10) || 1);
    if (!Number.isFinite(id)) throw new Error('Producto inválido');

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
      if (currentStock === null || currentStock === undefined) break; // sin control de stock
      if (typeof currentStock !== 'number') throw new Error('Stock inválido en producto');
      if (currentStock < qty) {
        const name = row?.nombre ? ` (${row.nombre})` : '';
        throw new Error(`Sin stock suficiente${name}. Disponible: ${currentStock}`);
      }

      const nextStock = currentStock - qty;
      const { data: updated, error: updErr } = await supabase
        .from('productos')
        .update({ stock: nextStock })
        .eq('id', id)
        .eq('stock', currentStock)
        .select('id')
        .maybeSingle();

      if (updErr) throw new Error(updErr.message || 'No se pudo actualizar stock');
      if (updated?.id) break;
    }
  }
}

function buildWhatsAppText(items, meta) {
  const lines = [];
  lines.push('Hola! Quiero comprar:');
  lines.push('');
  for (const it of items) {
    const name = it.name || it.title || `Producto ${it.id}`;
    const qty = Math.max(1, parseInt(it.quantity, 10) || 1);
    const price = it.price != null && it.price !== '' ? Number(it.price) : null;
    lines.push(`- ${name} x${qty}${price != null && Number.isFinite(price) ? ` ($${price.toLocaleString('es-AR')})` : ''}`);
  }
  lines.push('');
  if (meta?.total != null && Number.isFinite(Number(meta.total))) {
    lines.push(`Total: $${Number(meta.total).toLocaleString('es-AR')}`);
  }
  lines.push('');
  lines.push('Nombre:');
  lines.push('Dirección:');
  lines.push('Localidad:');
  lines.push('Forma de pago:');
  return lines.join('\n');
}

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed' });

  try {
    const input = req.body && typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const itemsRaw = input?.items;
    if (!Array.isArray(itemsRaw) || !itemsRaw.length) {
      return res.status(400).json({ success: false, error: 'No items provided' });
    }

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return res.status(500).json({ success: false, error: 'Configura SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en Vercel' });
    }

    const items = itemsRaw.map(it => ({
      id: it.id,
      name: it.name,
      quantity: Math.max(1, parseInt(it.quantity, 10) || 1),
      price: it.price
    }));

    // 1) Validar y descontar stock
    await reserveStockOrFail(supabase, items);

    // 2) Armar link de WhatsApp
    const phone = process.env.WHATSAPP_PHONE || '5493543560057'; // +54 9 3543 56-0057
    const total = items.reduce((sum, it) => sum + (Number(it.price) || 0) * (Number(it.quantity) || 1), 0);
    const text = buildWhatsAppText(items, { total });
    const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;

    return res.status(200).json({ success: true, whatsapp_url: whatsappUrl });
  } catch (error) {
    console.error('whatsapp-checkout error:', error);
    return res.status(500).json({ success: false, error: error?.message || 'Error en el servidor' });
  }
}

