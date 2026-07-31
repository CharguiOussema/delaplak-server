import mongoose, { Document, Schema, Types } from 'mongoose';
import { I18nText } from './category.model';

export interface AttributeOption {
  _id: Types.ObjectId;
  name: I18nText;
}

export interface ProductAttributeDocument extends Document {
  _id: Types.ObjectId;
  name: I18nText;
  slug: string;
  options: Types.DocumentArray<AttributeOption>;
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

const attributeOptionSchema = new Schema<AttributeOption>({
  name: { type: i18nTextSchema, required: true },
});

// Admin-managed vocabulary (e.g. Texture, Thickness, Dimensions) and their option names.
// Intentionally carries no price: the price impact of an option is product-specific and
// lives on Product.attributeOptions instead (see product.model.ts).
const productAttributeSchema = new Schema<ProductAttributeDocument>(
  {
    name: { type: i18nTextSchema, required: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    options: { type: [attributeOptionSchema], default: [] },
    isDeleted: { type: Boolean, default: false },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true },
);

export const ProductAttributeModel = mongoose.model<ProductAttributeDocument>('ProductAttribute', productAttributeSchema);
