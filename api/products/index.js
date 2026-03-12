import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // Fallback for dev without env vars
  console.warn('Missing Supabase env vars - using fallback');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

export default async function handler(req, res) {
  try {
    let products = [];

    if (supabaseUrl && supabaseAnonKey) {
      // Live from Supabase
      const { data, error } = await supabase
        .from('productos')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase error:', error);
        // Continue with fallback
      } else {
        products = data || [];
      }
    }

    // Ensure compatibility with frontend (filter valid products)
    products = products.filter(p => p.name && p.price > 0);

    res.status(200).json(products);
  } catch (error) {
    console.error('Products error:', error);
    res.status(500).json([]);
  }
}

