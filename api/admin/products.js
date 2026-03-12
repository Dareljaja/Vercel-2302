import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase env vars: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const JWT_SECRET = process.env.JWT_SECRET || 'shop2302_secret_dev';

const verifyToken = (req) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) throw new Error('No token');
  return jwt.verify(token, JWT_SECRET);
};

const sanitize = (str) => str?.toString().replace(/[&<>\\"'\\/]/g, '');

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    verifyToken(req);

    if (req.method === 'GET') {
      // List all products
      const { data: products, error } = await supabaseAdmin
        .from('productos')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      res.status(200).json({ success: true, products });

    } else if (req.method === 'POST') {
      // Create product
      const input = req.body;

      const product = {
        name: sanitize(input.name),
        description: sanitize(input.description),
        shortDescription: sanitize(input.shortDescription),
        price: parseFloat(input.price) || 0,
        category: sanitize(input.category) || 'face',
        image_url: sanitize(input.image_url),
        popular: !!input.popular,
        offer: !!input.offer,
        size: sanitize(input.size),
        ingredients: sanitize(input.ingredients),
        howToUse: sanitize(input.howToUse)
      };

      const { data, error } = await supabaseAdmin
        .from('productos')
        .insert([product])
        .select()
        .single();

      if (error) throw error;

      res.status(201).json({ success: true, product: data });

    } else if (req.method === 'PUT') {
      // Update product {id, ...}
      const { id, ...updateData } = req.body;
      
      const cleanUpdate = {};
      Object.keys(updateData).forEach(key => {
        if (updateData[key] !== undefined && updateData[key] !== null) {
          cleanUpdate[key] = key === 'price' ? parseFloat(updateData[key]) || 0 :
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
    res.status(error.statusCode === 401 || error.message.includes('token') ? 401 : 500).json({ 
      success: false, 
      message: error.message 
    });
  }
}

