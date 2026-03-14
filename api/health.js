/**
 * Prueba: si este endpoint devuelve JSON, las rutas /api/* funcionan.
 * GET https://tu-proyecto.vercel.app/api/health
 */
export default function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.status(200).json({
    ok: true,
    message: 'API activa',
    env: process.env.SUPABASE_URL ? 'Supabase configurado' : 'Falta SUPABASE_URL'
  });
}
