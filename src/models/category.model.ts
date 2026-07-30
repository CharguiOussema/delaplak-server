import mongoose, { Document, Schema, Types } from 'mongoose';

export interface I18nText {
  en: string;
  fr: string;
  ar: string;
}

export interface CategoryDocument extends Document {
  _id: Types.ObjectId;
  name: I18nText;
  description: I18nText | null;
  slug: string;
  parent: Types.ObjectId | null;
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

const categorySchema = new Schema<CategoryDocument>(
  {
    name: { type: i18nTextSchema, required: true },
    description: { type: i18nTextSchema, default: null },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    parent: { type: Schema.Types.ObjectId, ref: 'Category', default: null },
    isDeleted: { type: Boolean, default: false },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true },
);

export const CategoryModel = mongoose.model<CategoryDocument>('Category', categorySchema);
