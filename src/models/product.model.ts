import mongoose, { Document, Schema, Types } from 'mongoose';
import { I18nText } from './category.model';

// One entry per attribute option this product offers. `priceAdjustment` is added to (or, if
// negative, subtracted from) `price` when a client selects `option` for `attribute` — the
// admin-managed attribute/option vocabulary itself (names only) lives in ProductAttribute;
// the price impact is product-specific and only ever lives here.
export interface ProductAttributeSelection {
  attribute: Types.ObjectId;
  option: Types.ObjectId;
  priceAdjustment: number;
}

export interface ProductDocument extends Document {
  _id: Types.ObjectId;
  name: I18nText;
  description: I18nText;
  images: string[];
  price: number;
  currency: string;
  attributeOptions: ProductAttributeSelection[];
  applicationDomains: string[];
  categories: Types.ObjectId[];
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

const productAttributeSelectionSchema = new Schema<ProductAttributeSelection>(
  {
    attribute: { type: Schema.Types.ObjectId, ref: 'ProductAttribute', required: true },
    option: { type: Schema.Types.ObjectId, required: true },
    priceAdjustment: { type: Number, required: true, default: 0 },
  },
  { _id: false },
);

// price.currency defaults to TND (Tunisian Dinar).
const productSchema = new Schema<ProductDocument>(
  {
    name: { type: i18nTextSchema, required: true },
    description: { type: i18nTextSchema, required: true },
    images: { type: [String], default: [] },
    price: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'TND' },
    attributeOptions: { type: [productAttributeSelectionSchema], default: [] },
    applicationDomains: { type: [String], default: [] },
    categories: {
      type: [{ type: Schema.Types.ObjectId, ref: 'Category' }],
      required: true,
      validate: {
        validator: (v: Types.ObjectId[]) => Array.isArray(v) && v.length > 0,
        message: 'At least one category is required',
      },
    },
    stock: { type: Number, default: 0, min: 0 },
    isDeleted: { type: Boolean, default: false },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true },
);

productSchema.index({ 'name.en': 'text', 'name.fr': 'text', 'name.ar': 'text' });
productSchema.index({ categories: 1 });

export const ProductModel = mongoose.model<ProductDocument>('Product', productSchema);
