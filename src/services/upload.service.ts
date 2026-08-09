import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import multer from 'multer';
import { ENV } from '../config';
import { BadRequestError } from '../errors';

const PRODUCTS_DIR = path.join(process.cwd(), ENV.UPLOAD_DIR, 'products');
const SITE_SETTINGS_DIR = path.join(process.cwd(), ENV.UPLOAD_DIR, 'site-settings');

export function ensureProductsDir() {
  if (!fs.existsSync(PRODUCTS_DIR)) {
    fs.mkdirSync(PRODUCTS_DIR, { recursive: true });
  }
}
ensureProductsDir();

export function ensureSiteSettingsDir() {
  if (!fs.existsSync(SITE_SETTINGS_DIR)) {
    fs.mkdirSync(SITE_SETTINGS_DIR, { recursive: true });
  }
}
ensureSiteSettingsDir();

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

// HEIC/HEIF included since it's the default photo format on iOS.
const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif']);

export const productImageUpload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024, files: 10 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      cb(new BadRequestError('Only image files (jpeg/png/webp/gif/heic) are allowed', 'upload.service.fileFilter'));
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

const siteSettingsStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    ensureSiteSettingsDir();
    cb(null, SITE_SETTINGS_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const name = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`;
    cb(null, name);
  },
});

// Single-file uploads (hero banner slots, one décor item at a time) — unlike product photos
// there's no gallery here, each field/item holds exactly one image, replaced in place.
export const siteSettingsImageUpload = multer({
  storage: siteSettingsStorage,
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      cb(new BadRequestError('Only image files (jpeg/png/webp/gif/heic) are allowed', 'upload.service.fileFilter'));
      return;
    }
    cb(null, true);
  },
});

export function deleteSiteSettingsImageFile(relativePath: string) {
  const fileName = path.basename(relativePath);
  const absolutePath = path.join(SITE_SETTINGS_DIR, fileName);
  if (fs.existsSync(absolutePath)) {
    fs.unlinkSync(absolutePath);
  }
}
