import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

const supabase = getSupabase();

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Solo POST permitido' });
  }

  if (!supabase) {
    return res.status(500).json({ success: false, message: 'Configuración del servidor incompleta' });
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch { body = {}; }
    }

    const {
      cliente_nombre,
      cliente_email,
      cliente_telefono,
      direccion,
      localidad,
      cp,
      comentarios,
      items,
      total
    } = body || {};

    if (!cliente_nombre || !cliente_email || !cliente_telefono || !direccion || !localidad) {
      return res.status(400).json({
        success: false,
        message: 'Faltan datos obligatorios: nombre, email, teléfono, dirección, localidad'
      });
    }

    const itemsArray = Array.isArray(items) ? items : [];
    const totalNum = total != null ? Number(total) : 0;

    const { data, error } = await supabase
      .from('pedidos')
      .insert([{
        cliente_nombre: String(cliente_nombre).trim().substring(0, 200),
        cliente_email: String(cliente_email).trim().substring(0, 200),
        cliente_telefono: String(cliente_telefono).trim().substring(0, 50),
        direccion: String(direccion).trim().substring(0, 500),
        localidad: String(localidad).trim().substring(0, 100),
        cp: (cp != null && cp !== '') ? String(cp).trim().substring(0, 20) : null,
        comentarios: (comentarios != null && comentarios !== '') ? String(comentarios).trim().substring(0, 1000) : null,
        items: itemsArray,
        total: totalNum,
        estado: 'pendiente_pago'
      }])
      .select('id, estado, created_at')
      .single();

    if (error) {
      if (error.code === '42P01') {
        return res.status(500).json({
          success: false,
          message: 'No existe la tabla "pedidos" en Supabase. Créala con el SQL indicado en el proyecto.'
        });
      }
      throw error;
    }

    return res.status(201).json({
      success: true,
      id: data.id,
      estado: data.estado,
      created_at: data.created_at
    });
  } catch (err) {
    console.error('Orders POST error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Error al guardar el pedido' });
  }
}
