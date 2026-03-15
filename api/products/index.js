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
    const defaultVis = () => ({ showDescription: true, showShortDescription: true, showSize: true, showIngredients: true, showHowToUse: true });
    const products = (data || []).filter(p => p != null).map(p => {
      const imageUrl = p.imagen_url ?? p.image ?? '';
      const vis = p.section_visibility && typeof p.section_visibility === 'object' ? p.section_visibility : defaultVis();
      return {
        ...p,
        name: p.nombre ?? p.name,
        nombre: p.nombre ?? p.name,
        price: p.precio ?? p.price,
        precio: p.precio ?? p.price,
        description: p['descripcion completa'] ?? p['descripcioncompleta'] ?? p.descripcion ?? p.description,
        descripcion: p['descripcion completa'] ?? p['descripcioncompleta'] ?? p.descripcion ?? p.description,
        shortDescription: p['descripcion corta'] ?? p['descripcioncorta'] ?? p.shortDescription,
        image: imageUrl,
        imagen_url: imageUrl,
        category: p.categoria ?? p.category,
        categoria: p.categoria ?? p.category,
        size: p.tamaño ?? p.size,
        tamaño: p.tamaño ?? p.size,
        ingredients: p.ingredientes ?? p.ingredients,
        ingredientes: p.ingredientes ?? p.ingredients,
        howToUse: p['modo de uso'] ?? p['mododeuso'] ?? p.howToUse,
        popular: p.popular ?? false,
        offer: p.offer ?? false,
        precio_oferta: p.precio_oferta != null ? Number(p.precio_oferta) : null,
        showDescription: vis.showDescription !== false,
        showShortDescription: vis.showShortDescription !== false,
        showSize: vis.showSize !== false,
        showIngredients: vis.showIngredients !== false,
        showHowToUse: vis.showHowToUse !== false
      };
    });

    return res.status(200).json(products);

  } catch (error) {
    console.error('Error en el servidor API:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}