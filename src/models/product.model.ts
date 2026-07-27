import mongoose, { Document, Schema, Types } from 'mongoose';
import { I18nText } from './category.model';

export interface ProductDocument extends Document {
  _id: Types.ObjectId;
  name: I18nText;
  description: I18nText;
  images: string[];
  price: number;
  currency: string;
  dimensions: string;
  thickness: string;
  texture: string;
  applicationDomains: string[];
  category: Types.ObjectId;
  stock: number;
  isDeleted: boolean;
  createdBy: Types.ObjectId | null;
  updatedBy: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const i18nTextSchema = new Schema<I18nText>(
  {
    en: { type: String, required: true },
    fr: { type: String, required: true },
    ar: { type: String, required: true },
  },
  { _id: false },
);

// price.currency defaults to MAD (Moroccan Dirham) since DeLAPLAK is a Morocco-based PVC panel vendor.
const productSchema = new Schema<ProductDocument>(
  {
    name: { type: i18nTextSchema, required: true },
    description: { type: i18nTextSchema, required: true },
    images: { type: [String], default: [] },
    price: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'MAD' },
    dimensions: { type: String, default: '' },
    thickness: { type: String, default: '' },
    texture: { type: String, default: '' },
    applicationDomains: { type: [String], default: [] },
    category: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    stock: { type: Number, default: 0, min: 0 },
    isDeleted: { type: Boolean, default: false },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true },
);

productSchema.index({ 'name.en': 'text', 'name.fr': 'text', 'name.ar': 'text' });
productSchema.index({ category: 1 });

export const ProductModel = mongoose.model<ProductDocument>('Product', productSchema);
