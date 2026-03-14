import { createClient } from '@supabase/supabase-js';
import { requireAuth } from './auth.js';

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

const supabaseAdmin = getSupabase();

const sanitize = (str) => str?.toString().replace(/[&<>\\"'\\/]/g, '');
// URLs no se sanitizan con lo anterior (quitaría / y &). Solo recortar espacios.
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

  // Verificar autenticación para todas las operaciones excepto OPTIONS
  if (!requireAuth(req, res)) {
    return;
  }

  if (!supabaseAdmin) {
    return res.status(500).json({
      success: false,
      message: 'Configura SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en Vercel (Settings > Environment Variables)'
    });
  }

  try {
    // Asegurar que req.body esté parseado (Vercel a veces lo deja como string)
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch { body = {}; }
    }
    if (body && typeof body === 'object' && !Array.isArray(body)) req.body = body;

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

      // Mapear columnas en español al formato del frontend (name, price, category...)
      // Algunos clientes devuelven columnas con espacios como "descripcion completa" o sin espacio
      const defaultVisibility = () => ({ showDescription: true, showShortDescription: true, showSize: true, showIngredients: true, showHowToUse: true });
      const products = (rows || []).map(p => {
        const vis = p.section_visibility && typeof p.section_visibility === 'object' ? p.section_visibility : defaultVisibility();
        return {
          ...p,
          name: p.nombre ?? p.name,
          price: p.precio ?? p.price,
          description: p['descripcion completa'] ?? p['descripcioncompleta'] ?? p.descripcion ?? p.description,
          shortDescription: p['descripcion corta'] ?? p['descripcioncorta'] ?? p.shortDescription,
          image_url: p.imagen_url ?? p.image_url,
          category: p.categoria ?? p.category,
          size: p.tamaño ?? p.size,
          ingredients: p.ingredientes ?? p.ingredients,
          howToUse: p['modo de uso'] ?? p['mododeuso'] ?? p.howToUse,
          popular: p.popular ?? false,
          offer: p.offer ?? false,
          showDescription: vis.showDescription !== false,
          showShortDescription: vis.showShortDescription !== false,
          showSize: vis.showSize !== false,
          showIngredients: vis.showIngredients !== false,
          showHowToUse: vis.showHowToUse !== false
        };
      });

      return res.status(200).json({ success: true, products });

    } else if (req.method === 'POST') {
      // Create product — columnas en español como en tu tabla Supabase
      const input = req.body;
      const imagenUrl = sanitizeUrl(input.image_url ?? input.imagen_url);

      const sectionVisibility = {
        showDescription: input.showDescription !== false,
        showShortDescription: input.showShortDescription !== false,
        showSize: input.showSize !== false,
        showIngredients: input.showIngredients !== false,
        showHowToUse: input.showHowToUse !== false
      };
      const product = {
        nombre: sanitize(input.name) || '',
        precio: parseFloat(input.price) || 0,
        imagen_url: imagenUrl,
        categoria: sanitize(input.category) || 'face',
        tamaño: sanitize(input.size) || '',
        'descripcion corta': sanitize(input.shortDescription) || '',
        'descripcion completa': sanitize(input.description) || '',
        ingredientes: sanitize(input.ingredients) || '',
        'modo de uso': sanitize(input.howToUse) || '',
        popular: Boolean(input.popular) || false,
        offer: Boolean(input.offer) || false,
        section_visibility: sectionVisibility
      };

      const { data, error } = await supabaseAdmin
        .from('productos')
        .insert([product])
        .select()
        .single();

      if (error) throw error;

      const vis = data.section_visibility && typeof data.section_visibility === 'object' ? data.section_visibility : {};
      const forFrontend = { ...data, name: data.nombre, price: data.precio, description: data['descripcion completa'], shortDescription: data['descripcion corta'], image_url: data.imagen_url, category: data.categoria, size: data.tamaño, ingredients: data.ingredientes, howToUse: data['modo de uso'], popular: data.popular ?? false, offer: data.offer ?? false, showDescription: vis.showDescription !== false, showShortDescription: vis.showShortDescription !== false, showSize: vis.showSize !== false, showIngredients: vis.showIngredients !== false, showHowToUse: vis.showHowToUse !== false };
      return res.status(201).json({ success: true, product: forFrontend });

    } else if (req.method === 'PUT') {
      // Update — mapear del frontend a columnas en español
      const { id, ...updateData } = req.body;
      const cleanUpdate = {};
      if (updateData.name !== undefined) cleanUpdate.nombre = sanitize(updateData.name);
      if (updateData.price !== undefined) cleanUpdate.precio = parseFloat(updateData.price) || 0;
      if (updateData.image_url !== undefined) cleanUpdate.imagen_url = sanitizeUrl(updateData.image_url);
      if (updateData.category !== undefined) cleanUpdate.categoria = sanitize(updateData.category);
      if (updateData.size !== undefined) cleanUpdate.tamaño = sanitize(updateData.size);
      if (updateData.shortDescription !== undefined) cleanUpdate['descripcion corta'] = sanitize(updateData.shortDescription);
      if (updateData.description !== undefined) cleanUpdate['descripcion completa'] = sanitize(updateData.description);
      if (updateData.ingredients !== undefined) cleanUpdate.ingredientes = sanitize(updateData.ingredients);
      if (updateData.howToUse !== undefined) cleanUpdate['modo de uso'] = sanitize(updateData.howToUse);
      if (updateData.popular !== undefined) cleanUpdate.popular = Boolean(updateData.popular);
      if (updateData.offer !== undefined) cleanUpdate.offer = Boolean(updateData.offer);
      if (updateData.showDescription !== undefined || updateData.showShortDescription !== undefined || updateData.showSize !== undefined || updateData.showIngredients !== undefined || updateData.showHowToUse !== undefined) {
        cleanUpdate.section_visibility = {
          showDescription: updateData.showDescription !== false,
          showShortDescription: updateData.showShortDescription !== false,
          showSize: updateData.showSize !== false,
          showIngredients: updateData.showIngredients !== false,
          showHowToUse: updateData.showHowToUse !== false
        };
      }

      const { data, error } = await supabaseAdmin
        .from('productos')
        .update(cleanUpdate)
        .eq('id', Number(id))
        .select()
        .single();

      if (error) throw error;

      const visPut = data.section_visibility && typeof data.section_visibility === 'object' ? data.section_visibility : {};
      const forFrontend = { ...data, name: data.nombre, price: data.precio, description: data['descripcion completa'], shortDescription: data['descripcion corta'], image_url: data.imagen_url, category: data.categoria, size: data.tamaño, ingredients: data.ingredientes, howToUse: data['modo de uso'], popular: data.popular ?? false, offer: data.offer ?? false, showDescription: visPut.showDescription !== false, showShortDescription: visPut.showShortDescription !== false, showSize: visPut.showSize !== false, showIngredients: visPut.showIngredients !== false, showHowToUse: visPut.showHowToUse !== false };
      return res.status(200).json({ success: true, product: forFrontend });

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

