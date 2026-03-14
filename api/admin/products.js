import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

const supabaseAdmin = getSupabase();

const sanitize = (str) => str?.toString().replace(/[&<>\\"'\\/]/g, '');

// Nombres de columnas en Supabase (pueden ser snake_case o español)
const COLS = {
  name: 'name',
  description: 'description',
  shortDescription: 'short_description',
  price: 'price',
  category: 'categoria',
  image_url: 'image_url',
  popular: 'popular',
  offer: 'offer',
  size: 'size',
  ingredients: 'ingredients',
  howToUse: 'how_to_use'
};

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (!supabaseAdmin) {
    return res.status(500).json({
      success: false,
      message: 'Configura SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en Vercel (Settings > Environment Variables)'
    });
  }

  try {
    if (req.method === 'POST' && (req.body == null || typeof req.body !== 'object')) {
      return res.status(400).json({
        success: false,
        message: 'Cuerpo de la petición inválido (body vacío o no JSON)'
      });
    }

    if (req.method === 'GET') {
      // List all products (ordenar por id por si la tabla no tiene created_at)
      const { data: rows, error } = await supabaseAdmin
        .from('productos')
        .select('*')
        .order('id', { ascending: false });

      if (error) throw error;

      // Normalizar nombres de columnas para el frontend (DB puede usar categoria, short_description, etc.)
      const products = (rows || []).map(p => ({
        ...p,
        category: p.categoria ?? p.category,
        shortDescription: p.short_description ?? p.shortDescription,
        howToUse: p.how_to_use ?? p.howToUse
      }));

      return res.status(200).json({ success: true, products });

    } else if (req.method === 'POST') {
      // Create product (columnas con nombres de la tabla en Supabase)
      const input = req.body;

      const product = {
        [COLS.name]: sanitize(input.name),
        [COLS.description]: sanitize(input.description),
        [COLS.shortDescription]: sanitize(input.shortDescription),
        [COLS.price]: parseFloat(input.price) || 0,
        [COLS.category]: sanitize(input.category) || 'face',
        [COLS.image_url]: sanitize(input.image_url),
        [COLS.popular]: !!input.popular,
        [COLS.offer]: !!input.offer,
        [COLS.size]: sanitize(input.size),
        [COLS.ingredients]: sanitize(input.ingredients),
        [COLS.howToUse]: sanitize(input.howToUse)
      };

      const { data, error } = await supabaseAdmin
        .from('productos')
        .insert([product])
        .select()
        .single();

      if (error) throw error;

      res.status(201).json({ success: true, product: data });

    } else if (req.method === 'PUT') {
      // Update product {id, ...} — mapear nombres del frontend a columnas de la tabla
      const { id, ...updateData } = req.body;
      const keyToCol = { name: COLS.name, description: COLS.description, shortDescription: COLS.shortDescription, price: COLS.price, category: COLS.category, image_url: COLS.image_url, popular: COLS.popular, offer: COLS.offer, size: COLS.size, ingredients: COLS.ingredients, howToUse: COLS.howToUse };

      const cleanUpdate = {};
      Object.keys(updateData).forEach(key => {
        if (updateData[key] !== undefined && updateData[key] !== null) {
          const col = keyToCol[key] || key;
          cleanUpdate[col] = key === 'price' ? parseFloat(updateData[key]) || 0 :
                             ['popular', 'offer'].includes(key) ? !!updateData[key] :
                             sanitize(updateData[key]);
        }
      });

      const { data, error } = await supabaseAdmin
        .from('productos')
        .update(cleanUpdate)
        .eq('id', Number(id))
        .select()
        .single();

      if (error) throw error;

      res.status(200).json({ success: true, product: data });

    } else if (req.method === 'DELETE') {
      // Delete ?id=123
      const { id } = req.query;

      const { error } = await supabaseAdmin
        .from('productos')
        .delete()
        .eq('id', Number(id));

      if (error) throw error;

      res.status(200).json({ success: true, message: 'Deleted' });

    } else {
      res.status(405).json({ success: false, message: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Admin products error:', error);
    const msg = (error && (error.message || error.toString)) ? (error.message || error.toString()) : 'Error en el servidor';
    const code = (error && error.statusCode === 401) || (typeof msg === 'string' && msg.includes('token')) ? 401 : 500;
    try {
      return res.status(code).json({ success: false, message: msg });
    } catch (e) {
      console.error('Failed to send error response', e);
    }
  }
}

