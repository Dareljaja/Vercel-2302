import { createClient } from '@supabase/supabase-js';

// CORRECCIÓN: Usar los nombres exactos que tienes en Vercel y .env.local
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Solo inicializamos si existen las variables
const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey, {
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

    // Devolvemos los datos (o un array vacío si no hay nada)
    return res.status(200).json(data || []);

  } catch (error) {
    console.error('Error en el servidor API:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}