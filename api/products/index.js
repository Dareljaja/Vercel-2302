import { createClient } from '@supabase/supabase-js';

// URL: NEXT_PUBLIC_SUPABASE_URL o SUPABASE_URL (misma que admin)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
// Clave: anon (recomendado para tienda) o service_role si solo tienes esa en Vercel
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = (supabaseUrl && supabaseKey)
  ? createClient(supabaseUrl, supabaseKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })
  : null;

export default async function handler(req, res) {
  // CORS: Esto permite que tu frontend consulte la API sin bloqueos
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (!supabase) {
      console.error('Error: Variables de Supabase no configuradas en Vercel');
      return res.status(500).json({ error: 'Configuración incompleta' });
    }

    // Consulta a la tabla 'productos'
    const { data, error } = await supabase
      .from('productos')
      .select('*')
      .order('id', { ascending: false }); // Ordenar por ID si no tienes created_at

    if (error) {
      console.error('Error de Supabase:', error.message);
      return res.status(500).json({ error: error.message });
    }

    // Mapear columnas en español a name, price, image, etc. para la web
    const products = (data || []).map(p => {
      const imageUrl = p.imagen_url ?? p.image ?? '';
      return {
        ...p,
        name: p.nombre ?? p.name,
        price: p.precio ?? p.price,
        description: p['descripcion completa'] ?? p.descripcion ?? p.description,
        image: imageUrl,
        imagen_url: imageUrl,
        category: p.categoria ?? p.category
      };
    });

    return res.status(200).json(products);

  } catch (error) {
    console.error('Error en el servidor API:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}