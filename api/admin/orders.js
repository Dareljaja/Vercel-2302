import { createClient } from '@supabase/supabase-js';
import { requireAuth } from './auth.js';

function getSupabase() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

const supabaseAdmin = getSupabase();

const ESTADOS = ['pendiente_pago', 'pagado', 'enviado'];

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (!requireAuth(req, res)) return;

  if (!supabaseAdmin) {
    return res.status(500).json({
      success: false,
      message: 'Configura SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY'
    });
  }

  try {
    // GET: listar todos los pedidos (más recientes primero)
    if (req.method === 'GET') {
      const { data: rows, error } = await supabaseAdmin
        .from('pedidos')
        .select('*')
        .order('id', { ascending: false });

      if (error) {
        if (error.code === '42P01') {
          return res.status(200).json({ success: true, orders: [] });
        }
        throw error;
      }

      const orders = (rows || []).map((r) => ({
        id: r.id,
        cliente_nombre: r.cliente_nombre || '',
        cliente_email: r.cliente_email || '',
        cliente_telefono: r.cliente_telefono || '',
        direccion: r.direccion || '',
        localidad: r.localidad || '',
        cp: r.cp || '',
        comentarios: r.comentarios || '',
        items: r.items || [],
        total: r.total != null ? Number(r.total) : 0,
        estado: ESTADOS.includes(r.estado) ? r.estado : 'pendiente_pago',
        created_at: r.created_at || null
      }));

      return res.status(200).json({ success: true, orders });
    }

    // PATCH: actualizar estado de un pedido
    if (req.method === 'PATCH') {
      let body = req.body;
      if (typeof body === 'string') {
        try { body = JSON.parse(body); } catch { body = {}; }
      }
      const { id, estado } = body || {};
      if (id == null || id === '') {
        return res.status(400).json({ success: false, message: 'Falta id del pedido' });
      }
      if (!ESTADOS.includes(estado)) {
        return res.status(400).json({ success: false, message: 'Estado inválido. Usa: pendiente_pago, pagado, enviado' });
      }

      const { data, error } = await supabaseAdmin
        .from('pedidos')
        .update({ estado })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return res.status(200).json({
        success: true,
        order: {
          id: data.id,
          estado: data.estado,
          cliente_nombre: data.cliente_nombre,
          total: data.total
        }
      });
    }

    return res.status(405).json({ success: false, message: 'Método no permitido' });
  } catch (err) {
    console.error('Admin orders error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Error en el servidor' });
  }
}
