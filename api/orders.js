import { createClient } from '@supabase/supabase-js';
import { requireAuth } from './admin/auth.js';

function getSupabase() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

const supabase = getSupabase();
const ESTADOS = ['pendiente_pago', 'pagado', 'enviado'];

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // POST: crear pedido (público, desde checkout)
  if (req.method === 'POST') {
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

  // GET y PATCH: requieren autenticación admin
  if (req.method === 'GET' || req.method === 'PATCH') {
    if (!requireAuth(req, res)) return;
    if (!supabase) {
      return res.status(500).json({ success: false, message: 'Configura SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY' });
    }
  }

  try {
    // GET: listar pedidos (admin)
    if (req.method === 'GET') {
      const { data: rows, error } = await supabase
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

    // PATCH: actualizar estado (admin)
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

      const { data, error } = await supabase
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
    console.error('Orders API error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Error en el servidor' });
  }
}
