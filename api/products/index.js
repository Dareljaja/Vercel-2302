import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

export default function handler(req, res) {
  try {
    const productsPath = resolve('./api/products.json');
    if (existsSync(productsPath)) {
      const productsData = readFileSync(productsPath, 'utf8');
      const products = JSON.parse(productsData);
      res.status(200).json(products);
    } else {
      res.status(404).json([]);
    }
  } catch (error) {
    console.error('Products load error:', error);
    res.status(500).json({ error: 'Failed to load products' });
  }
}
