import { put } from '@vercel/blob';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ success: false, message: 'Method not allowed' });
    }

    // Vercel Blob upload (multipart/form-data)
    if (!req.files?.image) {
      return res.status(400).json({ success: false, message: 'No image file' });
    }

    const file = req.files.image;
    const blob = await put(file.name, file.buffer, {
      access: 'public',
      handleUploadUrl: `${req.headers.origin}/api/admin/upload-callback`,
    });

    res.status(200).json({
      success: true,
      filename: file.name,
      url: blob.url,
      blobId: blob.id
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ success: false, message: error.message || 'Upload failed' });
  }
}

// Optional callback for large uploads
export const config = {
  api: {
    bodyParser: false,
  },
};

