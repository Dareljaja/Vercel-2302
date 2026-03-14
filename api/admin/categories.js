import { createClient } from '@supabase/supabase-js';
import { requireAuth } from './auth.js';

function getSupabase() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

const supabaseAdmin = getSupabase();

const sanitize = (str) => (str != null ? String(str).replace(/[&<>\\"'\\/]/g, '').trim() : '');

function slugFrom(str) {
  const s = sanitize(str).toLowerCase();
  return s.replace(/\s+/g, '-').replace(/[^a-z0-9-_]/g, '') || 'cat';
}

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (!requireAuth(req, res)) return;

  if (!supabaseAdmin) {
    return res.status(500).json({ success: false, message: 'Configura Supabase' });
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch { body = {}; }
    }
    if (body && typeof body === 'object' && !Array.isArray(body)) req.body = body;

    if (req.method === 'GET') {
      const { data, error } = await supabaseAdmin
        .from('categorias')
        .select('id, nombre, slug')
        .order('nombre', { ascending: true });

      if (error) throw error;
      const list = (data || []).map((r) => ({
        id: r.id,
        nombre: r.nombre || '',
        slug: r.slug || ''
      }));
      return res.status(200).json({ success: true, categories: list });
    }

    if (req.method === 'POST') {
      const input = req.body || {};
      const nombre = sanitize(input.nombre) || '';
      let slug = sanitize(input.slug);
      if (!nombre) {
        return res.status(400).json({ success: false, message: 'El nombre es obligatorio.' });
      }
      if (!slug) slug = slugFrom(nombre);

      const { data, error } = await supabaseAdmin
        .from('categorias')
        .insert([{ nombre, slug }])
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          return res.status(400).json({ success: false, message: 'Ya existe una categoría con ese slug.' });
        }
        throw error;
      }
      return res.status(201).json({
        success: true,
        category: { id: data.id, nombre: data.nombre, slug: data.slug }
      });
    }

    if (req.method === 'DELETE') {
      const { id } = req.query;
      if (id == null) {
        return res.status(400).json({ success: false, message: 'Falta id' });
      }

      const idNum = Number(id);
      const { data: cat } = await supabaseAdmin
        .from('categorias')
        .select('slug')
        .eq('id', idNum)
        .single();

      if (cat && cat.slug) {
        const { data: used } = await supabaseAdmin
          .from('productos')
          .select('id')
          .eq('categoria', cat.slug)
          .limit(1);
        if (used && used.length > 0) {
          return res.status(400).json({
            success: false,
            message: 'No se puede eliminar: hay productos con esta categoría. Cambia su categoría antes.'
          });
        }
      }

      const { error } = await supabaseAdmin
        .from('categorias')
        .delete()
        .eq('id', idNum);

      if (error) throw error;
      return res.status(200).json({ success: true, message: 'Deleted' });
    }

    return res.status(405).json({ success: false, message: 'Method not allowed' });
  } catch (err) {
    console.error('Admin categories error:', err);
    return res.status(500).json({ success: false, message: err?.message || 'Error' });
  }
}
