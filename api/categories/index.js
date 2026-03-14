import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = (supabaseUrl && supabaseKey)
  ? createClient(supabaseUrl, supabaseKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })
  : null;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    if (!supabase) {
      return res.status(500).json({ error: 'Configuración incompleta' });
    }

    const { data, error } = await supabase
      .from('categorias')
      .select('id, nombre, slug')
      .order('nombre', { ascending: true });

    if (error) {
      console.error('Categories API error:', error.message);
      return res.status(500).json({ error: error.message });
    }

    const list = (data || []).map((row) => ({
      id: row.id,
      nombre: row.nombre || '',
      slug: row.slug || ''
    }));

    return res.status(200).json(list);
  } catch (err) {
    console.error('Categories API:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
