import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'shop2302_secret_dev';

export function verifyToken(req) {
  try {
    const authHeader = req.headers.authorization || req.headers.Authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
    return jwt.verify(authHeader.substring(7), JWT_SECRET);
  } catch {
    return null;
  }
}

export function requireAuth(req, res) {
  if (!verifyToken(req)) {
    res.status(401).json({ success: false, message: 'No autorizado. Inicia sesión primero.' });
    return false;
  }
  return true;
}
