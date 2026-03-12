import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import multer from 'multer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Ensure directories
['uploads', 'data'].forEach(dir => {
  const dirPath = path.join(__dirname, '..', dir);
  if (!existsSync(dirPath)) mkdirSync(dirPath, { recursive: true });
});

const DATA_DIR = path.join(__dirname, '..', 'data');
const PRODUCTS_FILE = path.join(DATA_DIR, 'products.json');
const CATEGORIES_FILE = path.join(DATA_DIR, 'categories.json');
const SALES_FILE = path.join(DATA_DIR, 'sales.json');
const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');

// Multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `product_${unique}${path.extname(file.originalname)}`);
  }
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

// Middleware to verify JWT
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ success: false, message: 'No token' });
  try {
    jwt.verify(token, process.env.JWT_SECRET || 'shop2302_secret');
    next();
  } catch {
    res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

// Helper functions
const readJson = (file) => {
  if (!existsSync(file)) return [];
  try {
    return JSON.parse(readFileSync(file, 'utf8'));
  } catch {
    return [];
  }
};

const writeJson = (file, data) => {
  writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
  return true;
};

const sanitize = (str) => str?.toString().replace(/[&<>\"']/g, '');

// Routes
app.options('*', cors());

// GET all products
app.get('/products', (req, res) => {
  const products = readJson(PRODUCTS_FILE);
  res.json({ success: true, products });
});

// POST create product (auth)
app.post('/create', verifyToken, (req, res) => {
  const input = req.body;
  let products = readJson(PRODUCTS_FILE);
  const newId = products.length ? Math.max(...products.map(p => p.id)) + 1 : 1;
  
  const product = {
    id: newId,
    name: sanitize(input.name),
    description: sanitize(input.description),
    price: parseFloat(input.price) || 0,
    category: sanitize(input.category),
    image: sanitize(input.image),
    paymentLink: sanitize(input.paymentLink),
    popular: !!input.popular,
    offer: !!input.offer
  };

  if (product.popular) products.forEach(p => p.popular = false);
  products.push(product);
  
  if (writeJson(PRODUCTS_FILE, products)) {
    res.json({ success: true, product });
  } else {
    res.status(500).json({ success: false });
  }
});

// Similar for update, delete, etc. (mirror PHP logic)
app.post('/update', verifyToken, (req, res) => {
  // Implementation similar to PHP
  res.json({ success: true });
});

app.post('/delete', verifyToken, (req, res) => {
  // ...
  res.json({ success: true });
});

// Upload (multipart)
app.post('/uploadImage', verifyToken, upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ success: false });
  res.json({ 
    success: true, 
    filename: req.file.filename,
    url: `/uploads/${req.file.filename}`
  });
});

// Categories, sales similar...

// Export for Vercel
export default app;
