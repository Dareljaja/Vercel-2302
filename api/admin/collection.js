import { createClient } from '@supabase/supabase-js';
import { requireAuth } from './auth.js';

function getSupabase() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

const supabaseAdmin = getSupabase();

const sanitize = (str) => (str != null ? String(str).replace(/[&<>\\"'\\/]/g, '') : '');
const sanitizeUrl = (str) => (str && typeof str === 'string' ? str.trim() : '') || '';

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
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
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch { body = {}; }
    }
    if (body && typeof body === 'object' && !Array.isArray(body)) req.body = body;

    if (req.method === 'GET') {
      const { data: rows, error } = await supabaseAdmin
        .from('coleccion')
        .select('*')
        .order('orden', { ascending: true })
        .order('id', { ascending: true });

      if (error) throw error;

      const items = (rows || []).map((r) => ({
        id: r.id,
        titulo: r.titulo || '',
        imagen_url: r.imagen_url || '',
        link: r.link || '',
        descripcion: r.descripcion || '',
        orden: r.orden != null ? Number(r.orden) : 0,
        activo: r.activo !== false
      }));

      return res.status(200).json({ success: true, items });
    }

    if (req.method === 'POST') {
      const input = req.body || {};
      const titulo = sanitize(input.titulo) || '';
      const imagen_url = sanitizeUrl(input.imagen_url);
      const link = sanitizeUrl(input.link) || sanitize(input.link) || '';
      const descripcion = sanitize(input.descripcion) || '';
      const orden = input.orden != null ? Number(input.orden) : 0;
      const activo = input.activo !== false;

      const { data, error } = await supabaseAdmin
        .from('coleccion')
        .insert([{ titulo, imagen_url, link, descripcion, orden, activo }])
        .select()
        .single();

      if (error) throw error;

      return res.status(201).json({
        success: true,
        item: {
          id: data.id,
          titulo: data.titulo,
          imagen_url: data.imagen_url,
          link: data.link,
          descripcion: data.descripcion,
          orden: data.orden,
          activo: data.activo !== false
        }
      });
    }

    if (req.method === 'PUT') {
      const { id, ...rest } = req.body || {};
      if (id == null) {
        return res.status(400).json({ success: false, message: 'Falta id' });
      }
      const clean = {};
      if (rest.titulo !== undefined) clean.titulo = sanitize(rest.titulo);
      if (rest.imagen_url !== undefined) clean.imagen_url = sanitizeUrl(rest.imagen_url) || rest.imagen_url;
      if (rest.link !== undefined) clean.link = sanitizeUrl(rest.link) || sanitize(rest.link) || '';
      if (rest.descripcion !== undefined) clean.descripcion = sanitize(rest.descripcion);
      if (rest.orden !== undefined) clean.orden = Number(rest.orden);
      if (rest.activo !== undefined) clean.activo = rest.activo !== false;

      const { data, error } = await supabaseAdmin
        .from('coleccion')
        .update(clean)
        .eq('id', Number(id))
        .select()
        .single();

      if (error) throw error;

      return res.status(200).json({
        success: true,
        item: {
          id: data.id,
          titulo: data.titulo,
          imagen_url: data.imagen_url,
          link: data.link,
          descripcion: data.descripcion,
          orden: data.orden,
          activo: data.activo !== false
        }
      });
    }

    if (req.method === 'DELETE') {
      const { id } = req.query;
      if (id == null) {
        return res.status(400).json({ success: false, message: 'Falta id' });
      }

      const { error } = await supabaseAdmin
        .from('coleccion')
        .delete()
        .eq('id', Number(id));

      if (error) throw error;
      return res.status(200).json({ success: true, message: 'Deleted' });
    }

    return res.status(405).json({ success: false, message: 'Method not allowed' });
  } catch (error) {
    console.error('Admin collection error:', error);
    const msg = error?.message || String(error);
    const code = msg.includes('token') || msg.includes('auth') ? 401 : 500;
    return res.status(code).json({ success: false, message: msg });
  }
}
