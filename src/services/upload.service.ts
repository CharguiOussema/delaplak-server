import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import multer from 'multer';
import { ENV } from '../config';

const PRODUCTS_DIR = path.join(process.cwd(), ENV.UPLOAD_DIR, 'products');

export function ensureProductsDir() {
  if (!fs.existsSync(PRODUCTS_DIR)) {
    fs.mkdirSync(PRODUCTS_DIR, { recursive: true });
  }
}
ensureProductsDir();

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    ensureProductsDir();
    cb(null, PRODUCTS_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const name = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`;
    cb(null, name);
  },
});

const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

export const productImageUpload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024, files: 10 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      cb(new Error('Only image files (jpeg/png/webp/gif) are allowed'));
      return;
    }
    cb(null, true);
  },
});

export function productImageRelativePath(fileName: string): string {
  return `/uploads/products/${fileName}`;
}

export function deleteProductImageFile(relativePath: string) {
  const fileName = path.basename(relativePath);
  const absolutePath = path.join(PRODUCTS_DIR, fileName);
  if (fs.existsSync(absolutePath)) {
    fs.unlinkSync(absolutePath);
  }
}
