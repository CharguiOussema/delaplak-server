import mongoose, { Document, Schema, Types } from 'mongoose';
import { I18nText } from './category.model';

// Singleton document (single row identified by `key: 'main'`, enforced by the unique index
// below) holding every admin-editable piece of the public home page: hero banner, the
// "strengths" bullet list, the décor/finish showcase grid, and the closing call-to-action.
// There is intentionally no separate "home page" collection — one row, updated in place.

export interface HeroSection {
  eyebrow: I18nText;
  titleLine1: I18nText;
  titleAccent: I18nText;
  intro: I18nText;
  ctaPrimaryLabel: I18nText;
  ctaSecondaryLabel: I18nText;
  mainImage: string;
  accentImage: string;
}

export interface StrengthItem {
  _id: Types.ObjectId;
  text: I18nText;
}

export interface StrengthsSection {
  eyebrow: I18nText;
  title: I18nText;
}

export interface DecorItem {
  _id: Types.ObjectId;
  title: I18nText;
  image: string;
}

export interface DecorsSection {
  eyebrow: I18nText;
  title: I18nText;
  discoverLabel: I18nText;
}

export interface CtaSection {
  title: I18nText;
  actionLabel: I18nText;
}

export interface SiteSettingsDocument extends Document {
  _id: Types.ObjectId;
  key: string;
  hero: HeroSection;
  strengthsSection: StrengthsSection;
  strengths: Types.DocumentArray<StrengthItem>;
  decorsSection: DecorsSection;
  decors: Types.DocumentArray<DecorItem>;
  cta: CtaSection;
  updatedBy: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

// The one and only row this collection will ever hold.
export const SITE_SETTINGS_KEY = 'main';

const i18nTextSchema = new Schema<I18nText>(
  {
    en: { type: String, required: true },
    fr: { type: String, required: true },
    ar: { type: String, required: true },
  },
  { _id: false },
);

const heroSchema = new Schema<HeroSection>(
  {
    eyebrow: { type: i18nTextSchema, required: true },
    titleLine1: { type: i18nTextSchema, required: true },
    titleAccent: { type: i18nTextSchema, required: true },
    intro: { type: i18nTextSchema, required: true },
    ctaPrimaryLabel: { type: i18nTextSchema, required: true },
    ctaSecondaryLabel: { type: i18nTextSchema, required: true },
    mainImage: { type: String, default: '' },
    accentImage: { type: String, default: '' },
  },
  { _id: false },
);

const strengthItemSchema = new Schema<StrengthItem>({
  text: { type: i18nTextSchema, required: true },
});

const strengthsSectionSchema = new Schema<StrengthsSection>(
  {
    eyebrow: { type: i18nTextSchema, required: true },
    title: { type: i18nTextSchema, required: true },
  },
  { _id: false },
);

const decorItemSchema = new Schema<DecorItem>({
  title: { type: i18nTextSchema, required: true },
  image: { type: String, default: '' },
});

const decorsSectionSchema = new Schema<DecorsSection>(
  {
    eyebrow: { type: i18nTextSchema, required: true },
    title: { type: i18nTextSchema, required: true },
    discoverLabel: { type: i18nTextSchema, required: true },
  },
  { _id: false },
);

const ctaSchema = new Schema<CtaSection>(
  {
    title: { type: i18nTextSchema, required: true },
    actionLabel: { type: i18nTextSchema, required: true },
  },
  { _id: false },
);

const siteSettingsSchema = new Schema<SiteSettingsDocument>(
  {
    key: { type: String, required: true, unique: true, default: SITE_SETTINGS_KEY },
    hero: { type: heroSchema, required: true },
    strengthsSection: { type: strengthsSectionSchema, required: true },
    strengths: { type: [strengthItemSchema], default: [] },
    decorsSection: { type: decorsSectionSchema, required: true },
    decors: { type: [decorItemSchema], default: [] },
    cta: { type: ctaSchema, required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true },
);

export const SiteSettingsModel = mongoose.model<SiteSettingsDocument>('SiteSettings', siteSettingsSchema);
