/**
 * Router único admin: categories, products, collection.
 * Uso: /api/admin?resource=categories | products | collection
 * Reduce funciones serverless para plan Hobby (máx 12).
 */
import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';

const JWT_SECRET = process.env.JWT_SECRET || 'shop2302_secret_dev';

function verifyToken(req) {
  try {
    const authHeader = req.headers.authorization || req.headers.Authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
    return jwt.verify(authHeader.substring(7), JWT_SECRET);
  } catch {
    return null;
  }
}

function requireAuth(req, res) {
  if (!verifyToken(req)) {
    res.status(401).json({ success: false, message: 'No autorizado. Inicia sesión primero.' });
    return false;
  }
  return true;
}

function getSupabase() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

const supabaseAdmin = getSupabase();
const sanitize = (str) => (str != null ? String(str).replace(/[&<>\\"'\\/]/g, '').trim() : '');
const sanitizeUrl = (str) => (str && typeof str === 'string' ? str.trim() : '') || '';
function slugFrom(str) {
  const s = sanitize(str).toLowerCase();
  return s.replace(/\s+/g, '-').replace(/[^a-z0-9-_]/g, '') || 'cat';
}

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (!requireAuth(req, res)) return;
  if (!supabaseAdmin) return res.status(500).json({ success: false, message: 'Configura Supabase' });

  const resource = (req.query?.resource || req.body?.resource || '').toLowerCase();

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  if (body && typeof body === 'object' && !Array.isArray(body)) req.body = body;

  try {
    if (resource === 'categories') return await handleCategories(req, res);
    if (resource === 'products') return await handleProducts(req, res);
    if (resource === 'collection') return await handleCollection(req, res);
    return res.status(400).json({ success: false, message: 'Falta resource=categories|products|collection' });
  } catch (err) {
    console.error('Admin router error:', err);
    return res.status(500).json({ success: false, message: err?.message || 'Error' });
  }
}

async function handleCategories(req, res) {
  if (req.method === 'GET') {
    const { data, error } = await supabaseAdmin.from('categorias').select('id, nombre, slug').order('nombre', { ascending: true });
    if (error) throw error;
    const list = (data || []).map((r) => ({ id: r.id, nombre: r.nombre || '', slug: r.slug || '' }));
    return res.status(200).json({ success: true, categories: list });
  }
  if (req.method === 'POST') {
    const input = req.body || {};
    const nombre = sanitize(input.nombre) || '';
    let slug = sanitize(input.slug);
    if (!nombre) return res.status(400).json({ success: false, message: 'El nombre es obligatorio.' });
    if (!slug) slug = slugFrom(nombre);
    const { data, error } = await supabaseAdmin.from('categorias').insert([{ nombre, slug }]).select().single();
    if (error) {
      if (error.code === '23505') return res.status(400).json({ success: false, message: 'Ya existe una categoría con ese slug.' });
      throw error;
    }
    return res.status(201).json({ success: true, category: { id: data.id, nombre: data.nombre, slug: data.slug } });
  }
  if (req.method === 'DELETE') {
    const id = req.query?.id;
    if (id == null) return res.status(400).json({ success: false, message: 'Falta id' });
    const idNum = Number(id);
    const { data: cat } = await supabaseAdmin.from('categorias').select('slug').eq('id', idNum).single();
    if (cat?.slug) {
      const { data: used } = await supabaseAdmin.from('productos').select('id').eq('categoria', cat.slug).limit(1);
      if (used?.length > 0) return res.status(400).json({ success: false, message: 'No se puede eliminar: hay productos con esta categoría.' });
    }
    const { error } = await supabaseAdmin.from('categorias').delete().eq('id', idNum);
    if (error) throw error;
    return res.status(200).json({ success: true, message: 'Deleted' });
  }
  return res.status(405).json({ success: false, message: 'Method not allowed' });
}

const defaultVisibility = () => ({ showDescription: true, showShortDescription: true, showSize: true, showIngredients: true, showHowToUse: true });

async function handleProducts(req, res) {
  if (req.method === 'POST' && (req.body == null || typeof req.body !== 'object')) {
    return res.status(400).json({ success: false, message: 'Cuerpo de la petición inválido' });
  }
  if (req.method === 'GET') {
    const { data: rows, error } = await supabaseAdmin.from('productos').select('*').order('id', { ascending: false });
    if (error) throw error;
    const products = (rows || []).map((p) => {
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
        precio_oferta: p.precio_oferta != null ? Number(p.precio_oferta) : null,
        showDescription: vis.showDescription !== false,
        showShortDescription: vis.showShortDescription !== false,
        showSize: vis.showSize !== false,
        showIngredients: vis.showIngredients !== false,
        showHowToUse: vis.showHowToUse !== false
      };
    });
    return res.status(200).json({ success: true, products });
  }
  if (req.method === 'POST') {
    const input = req.body;
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
      imagen_url: sanitizeUrl(input.image_url ?? input.imagen_url),
      categoria: sanitize(input.category) || 'face',
      tamaño: sanitize(input.size) || '',
      'descripcion corta': sanitize(input.shortDescription) || '',
      'descripcion completa': sanitize(input.description) || '',
      ingredientes: sanitize(input.ingredients) || '',
      'modo de uso': sanitize(input.howToUse) || '',
      popular: Boolean(input.popular) || false,
      offer: Boolean(input.offer) || false,
      precio_oferta: input.precio_oferta != null && input.precio_oferta !== '' ? parseFloat(input.precio_oferta) : null,
      section_visibility: sectionVisibility
    };
    const { data, error } = await supabaseAdmin.from('productos').insert([product]).select().single();
    if (error) throw error;
    const vis = data.section_visibility && typeof data.section_visibility === 'object' ? data.section_visibility : {};
    const forFrontend = { ...data, name: data.nombre, price: data.precio, description: data['descripcion completa'], shortDescription: data['descripcion corta'], image_url: data.imagen_url, category: data.categoria, size: data.tamaño, ingredients: data.ingredientes, howToUse: data['modo de uso'], popular: data.popular ?? false, offer: data.offer ?? false, precio_oferta: data.precio_oferta != null ? Number(data.precio_oferta) : null, showDescription: vis.showDescription !== false, showShortDescription: vis.showShortDescription !== false, showSize: vis.showSize !== false, showIngredients: vis.showIngredients !== false, showHowToUse: vis.showHowToUse !== false };
    return res.status(201).json({ success: true, product: forFrontend });
  }
  if (req.method === 'PUT') {
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
    if (updateData.precio_oferta !== undefined) cleanUpdate.precio_oferta = updateData.precio_oferta != null && updateData.precio_oferta !== '' ? parseFloat(updateData.precio_oferta) : null;
    if ([updateData.showDescription, updateData.showShortDescription, updateData.showSize, updateData.showIngredients, updateData.showHowToUse].some((x) => x !== undefined)) {
      cleanUpdate.section_visibility = { showDescription: updateData.showDescription !== false, showShortDescription: updateData.showShortDescription !== false, showSize: updateData.showSize !== false, showIngredients: updateData.showIngredients !== false, showHowToUse: updateData.showHowToUse !== false };
    }
    const { data, error } = await supabaseAdmin.from('productos').update(cleanUpdate).eq('id', Number(id)).select().single();
    if (error) throw error;
    const visPut = data.section_visibility && typeof data.section_visibility === 'object' ? data.section_visibility : {};
    const forFrontend = { ...data, name: data.nombre, price: data.precio, description: data['descripcion completa'], shortDescription: data['descripcion corta'], image_url: data.imagen_url, category: data.categoria, size: data.tamaño, ingredients: data.ingredientes, howToUse: data['modo de uso'], popular: data.popular ?? false, offer: data.offer ?? false, precio_oferta: data.precio_oferta != null ? Number(data.precio_oferta) : null, showDescription: visPut.showDescription !== false, showShortDescription: visPut.showShortDescription !== false, showSize: visPut.showSize !== false, showIngredients: visPut.showIngredients !== false, showHowToUse: visPut.showHowToUse !== false };
    return res.status(200).json({ success: true, product: forFrontend });
  }
  if (req.method === 'DELETE') {
    const { id } = req.query;
    const { error } = await supabaseAdmin.from('productos').delete().eq('id', Number(id));
    if (error) throw error;
    return res.status(200).json({ success: true, message: 'Deleted' });
  }
  return res.status(405).json({ success: false, message: 'Method not allowed' });
}

async function handleCollection(req, res) {
  if (req.method === 'GET') {
    const { data: rows, error } = await supabaseAdmin.from('coleccion').select('*').order('orden', { ascending: true }).order('id', { ascending: true });
    if (error) throw error;
    const items = (rows || []).map((r) => ({ id: r.id, titulo: r.titulo || '', imagen_url: r.imagen_url || '', link: r.link || '', descripcion: r.descripcion || '', orden: r.orden != null ? Number(r.orden) : 0, activo: r.activo !== false }));
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
    const { data, error } = await supabaseAdmin.from('coleccion').insert([{ titulo, imagen_url, link, descripcion, orden, activo }]).select().single();
    if (error) throw error;
    return res.status(201).json({ success: true, item: { id: data.id, titulo: data.titulo, imagen_url: data.imagen_url, link: data.link, descripcion: data.descripcion, orden: data.orden, activo: data.activo !== false } });
  }
  if (req.method === 'PUT') {
    const { id, ...rest } = req.body || {};
    if (id == null) return res.status(400).json({ success: false, message: 'Falta id' });
    const clean = {};
    if (rest.titulo !== undefined) clean.titulo = sanitize(rest.titulo);
    if (rest.imagen_url !== undefined) clean.imagen_url = sanitizeUrl(rest.imagen_url) || rest.imagen_url;
    if (rest.link !== undefined) clean.link = sanitizeUrl(rest.link) || sanitize(rest.link) || '';
    if (rest.descripcion !== undefined) clean.descripcion = sanitize(rest.descripcion);
    if (rest.orden !== undefined) clean.orden = Number(rest.orden);
    if (rest.activo !== undefined) clean.activo = rest.activo !== false;
    const { data, error } = await supabaseAdmin.from('coleccion').update(clean).eq('id', Number(id)).select().single();
    if (error) throw error;
    return res.status(200).json({ success: true, item: { id: data.id, titulo: data.titulo, imagen_url: data.imagen_url, link: data.link, descripcion: data.descripcion, orden: data.orden, activo: data.activo !== false } });
  }
  if (req.method === 'DELETE') {
    const { id } = req.query;
    if (id == null) return res.status(400).json({ success: false, message: 'Falta id' });
    const { error } = await supabaseAdmin.from('coleccion').delete().eq('id', Number(id));
    if (error) throw error;
    return res.status(200).json({ success: true, message: 'Deleted' });
  }
  return res.status(405).json({ success: false, message: 'Method not allowed' });
}
