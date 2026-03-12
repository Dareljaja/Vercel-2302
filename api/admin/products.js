import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'shop2302_secret';

const verifyToken = (req) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) throw new Error('No token');
  return jwt.verify(token, JWT_SECRET);
};

// Helper: ./api/products.json (shared with public)
const PRODUCTS_FILE = resolve('./api/products.json');

const readProducts = () => {
  if (!existsSync(PRODUCTS_FILE)) return [];
  try {
    return JSON.parse(readFileSync(PRODUCTS_FILE, 'utf8'));
  } catch {
    return [];
  }
};

const writeProducts = (products) => {
  writeFileSync(PRODUCTS_FILE, JSON.stringify(products, null, 2), 'utf8');
  return true;
};

const sanitize = (str) => str?.toString().replace(/[&<>\"'']/g, '');

export default function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    verifyToken(req);

    if (req.method === 'GET') {
      // GET /api/admin/products - List products
      const products = readProducts();
      res.status(200).json({ success: true, products });

    } else if (req.method === 'POST') {
      // POST /api/admin/products - Create product
      const input = req.body;
      let products = readProducts();
      const newId = products.length ? Math.max(...products.map(p => p.id)) + 1 : 1;

      const product = {
        id: newId,
        name: sanitize(input.name),
        description: sanitize(input.description),
        shortDescription: sanitize(input.shortDescription),
        price: parseFloat(input.price) || 0,
        category: sanitize(input.category),
        image: sanitize(input.image),
        popular: !!input.popular,
        offer: !!input.offer,
        size: sanitize(input.size),
        ingredients: sanitize(input.ingredients),
        howToUse: sanitize(input.howToUse)
      };

      // Only one popular
      if (product.popular) products.forEach(p => p.popular = false);
      products.push(product);

      if (writeProducts(products)) {
        res.status(201).json({ success: true, product });
      } else {
        res.status(500).json({ success: false, message: 'Failed to save' });
      }

    } else {
      res.status(405).json({ success: false, message: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Admin products error:', error);
    res.status(401).json({ success: false, message: error.message || 'Unauthorized' });
  }
}

