import { put } from '@vercel/blob';
import { requireAuth } from './auth.js';
import busboy from 'busboy';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Verificar autenticación
  if (!requireAuth(req, res)) {
    return;
  }

  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ success: false, message: 'Method not allowed' });
    }

    const contentType = req.headers['content-type'] || '';
    if (!contentType.includes('multipart/form-data')) {
      return res.status(400).json({ success: false, message: 'Content-Type debe ser multipart/form-data' });
    }

    // Parsear FormData usando busboy
    const bb = busboy({ headers: req.headers });
    let fileBuffer = null;
    let filename = 'image.jpg';
    let fileFound = false;

    return new Promise((resolve, reject) => {
      bb.on('file', (name, file, info) => {
        if (name === 'file') {
          fileFound = true;
          filename = info.filename || 'image.jpg';
          const chunks = [];
          
          file.on('data', (chunk) => {
            chunks.push(chunk);
          });
          
          file.on('end', () => {
            fileBuffer = Buffer.concat(chunks);
          });
        } else {
          file.resume(); // Descartar otros archivos
        }
      });

      bb.on('finish', async () => {
        try {
          if (!fileFound || !fileBuffer || fileBuffer.length === 0) {
            return res.status(400).json({ success: false, message: 'No se encontró archivo en la petición' });
          }

          // Subir a Vercel Blob
          const blob = await put(filename, fileBuffer, {
            access: 'public',
          });

          res.status(200).json({
            success: true,
            url: blob.url,
            filename: filename
          });
          resolve();
        } catch (error) {
          console.error('Upload error:', error);
          res.status(500).json({ success: false, message: error.message || 'Error al subir la imagen' });
          resolve();
        }
      });

      bb.on('error', (err) => {
        console.error('Busboy error:', err);
        res.status(500).json({ success: false, message: 'Error al procesar el archivo' });
        resolve();
      });

      req.pipe(bb);
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ success: false, message: error.message || 'Error al subir la imagen' });
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};
