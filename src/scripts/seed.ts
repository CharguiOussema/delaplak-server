/**
 * Idempotent seed script — safe to run repeatedly (`yarn seed`), upserts by unique
 * email/slug so re-running never duplicates data.
 *
 * Seeds:
 *  - Default ADMIN user developer@delaplak.dev / Developer123!
 *  - Site settings (home page content) singleton, with its built-in default copy
 *  - Category "Textures" (parent) with 4 children: Wood, Marble, Fabric, Unicolor
 *  - 6 demo products spread across those categories
 */
import 'dotenv/config';
import 'reflect-metadata';
import mongoose from 'mongoose';
import { connectToDatabase } from '../config/database';
import { UserModel } from '../models/user.model';
import { CategoryModel } from '../models/category.model';
import { ProductModel } from '../models/product.model';
import { ProductAttributeModel } from '../models/productAttribute.model';
import { USER_ROLES } from '../types/consts';
import { hash } from '../services/bcrypt.service';
import { slugify } from '../helpers/common.helper';
import { siteSettingsRepository } from '../repositories/siteSettings.repository';

const DEV_EMAIL = 'developer@delaplak.dev';
const DEV_PASSWORD = 'Developer123!';

async function seedAdminUser() {
  const existing = await UserModel.findOne({ email: DEV_EMAIL });
  if (existing) {
    console.log(`[seed] User already exists: ${DEV_EMAIL} (${existing._id})`);
    return existing;
  }

  const passwordHash = await hash(DEV_PASSWORD);
  const user = await UserModel.create({
    email: DEV_EMAIL,
    fullName: 'DeLAPLAK Developer',
    phone: '+212600000000',
    passwordHash,
    role: USER_ROLES.ADMIN,
    isActive: true,
    preferredLanguage: 'en',
  });
  console.log(`[seed] User created: ${DEV_EMAIL} / ${DEV_PASSWORD} (${user._id})`);
  return user;
}

async function seedCategory(name: { en: string; fr: string; ar: string }, parentId: mongoose.Types.ObjectId | null) {
  const slug = slugify(name.en);
  const category = await CategoryModel.findOneAndUpdate(
    { slug },
    { $setOnInsert: { name, slug, parent: parentId, isDeleted: false } },
    { upsert: true, new: true },
  );
  console.log(`[seed] Category ready: ${name.en} (${category._id})`);
  return category;
}

async function seedAttribute(name: { en: string; fr: string; ar: string }, optionNames: { en: string; fr: string; ar: string }[]) {
  const slug = slugify(name.en);
  const attribute = await ProductAttributeModel.findOneAndUpdate(
    { slug },
    { $setOnInsert: { name, slug, options: optionNames.map((n) => ({ name: n })), isDeleted: false } },
    { upsert: true, new: true },
  );
  console.log(`[seed] Product attribute ready: ${name.en} (${attribute._id})`);
  return attribute;
}

async function seedProduct(data: {
  name: { en: string; fr: string; ar: string };
  description: { en: string; fr: string; ar: string };
  price: number;
  category: mongoose.Types.ObjectId;
  images: string[];
  attributeOptions?: { attribute: mongoose.Types.ObjectId; option: mongoose.Types.ObjectId; priceAdjustment: number }[];
}) {
  const { category, ...rest } = data;
  const product = await ProductModel.findOneAndUpdate(
    { 'name.en': data.name.en },
    {
      $setOnInsert: {
        ...rest,
        categories: [category],
        currency: 'TND',
        applicationDomains: ['habitat', 'offices'],
        stock: 100,
        isDeleted: false,
      },
    },
    { upsert: true, new: true },
  );
  console.log(`[seed] Product ready: ${data.name.en} (${product._id})`);
  return product;
}

async function main() {
  await connectToDatabase();
  console.log('[seed] Connected to database');

  await seedAdminUser();

  const siteSettings = await siteSettingsRepository.getOrCreate();
  console.log(`[seed] Site settings ready (${siteSettings._id})`);

  const textures = await seedCategory({ en: 'Textures', fr: 'Textures', ar: 'أنسجة' }, null);
  const wood = await seedCategory({ en: 'Wood', fr: 'Bois', ar: 'خشب' }, textures._id);
  const marble = await seedCategory({ en: 'Marble', fr: 'Marbre', ar: 'رخام' }, textures._id);
  const fabric = await seedCategory({ en: 'Fabric', fr: 'Tissu', ar: 'قماش' }, textures._id);
  const unicolor = await seedCategory({ en: 'Unicolor', fr: 'Unicolore', ar: 'لون واحد' }, textures._id);

  const finish = await seedAttribute({ en: 'Finish', fr: 'Finition', ar: 'التشطيب' }, [
    { en: 'Royal Mirror', fr: 'Miroir Royal', ar: 'مرآة ملكية' },
    { en: 'Celestial Midnight', fr: 'Minuit Céleste', ar: 'منتصف الليل السماوي' },
    { en: 'Oulan-Bator', fr: 'Oulan-Bator', ar: 'أولان باتور' },
  ]);
  const [royalMirror, celestialMidnight, oulanBator] = finish.options;

  await seedProduct({
    name: { en: 'Oak Wood Panel', fr: 'Panneau en bois de chêne', ar: 'لوح خشب البلوط' },
    description: {
      en: 'A warm oak-textured PVC wall panel, ideal for living rooms.',
      fr: 'Un panneau mural en PVC à texture chêne chaleureuse, idéal pour les salons.',
      ar: 'لوح جداري من PVC بنسيج خشب البلوط الدافئ، مثالي لغرف المعيشة.',
    },
    price: 149.9,
    category: wood._id,
    images: ['/uploads/products/placeholder-oak-wood.jpg'],
    attributeOptions: [
      { attribute: finish._id, option: royalMirror._id, priceAdjustment: 0 },
      { attribute: finish._id, option: celestialMidnight._id, priceAdjustment: 100 },
      { attribute: finish._id, option: oulanBator._id, priceAdjustment: -50 },
    ],
  });

  await seedProduct({
    name: { en: 'Walnut Wood Panel', fr: 'Panneau en bois de noyer', ar: 'لوح خشب الجوز' },
    description: {
      en: 'Rich walnut-toned PVC panel for a premium interior finish.',
      fr: 'Panneau en PVC aux tons de noyer riches pour une finition intérieure haut de gamme.',
      ar: 'لوح PVC بألوان الجوز الغنية لإنهاء داخلي فاخر.',
    },
    price: 159.9,
    category: wood._id,
    images: ['/uploads/products/placeholder-walnut-wood.jpg'],
  });

  await seedProduct({
    name: { en: 'Carrara Marble Panel', fr: 'Panneau en marbre de Carrare', ar: 'لوح رخام كارارا' },
    description: {
      en: 'Elegant white-veined marble-look panel for bathrooms and showrooms.',
      fr: "Élégant panneau effet marbre veiné blanc pour salles de bain et showrooms.",
      ar: 'لوح أنيق بمظهر الرخام الأبيض المعرق للحمامات وصالات العرض.',
    },
    price: 189.9,
    category: marble._id,
    images: ['/uploads/products/placeholder-carrara-marble.jpg'],
  });

  await seedProduct({
    name: { en: 'Black Marble Panel', fr: 'Panneau en marbre noir', ar: 'لوح رخام أسود' },
    description: {
      en: 'Bold black marble-effect panel for a modern statement wall.',
      fr: 'Panneau effet marbre noir audacieux pour un mur d’accent moderne.',
      ar: 'لوح بتأثير الرخام الأسود الجريء لجدار عصري مميز.',
    },
    price: 199.9,
    category: marble._id,
    images: ['/uploads/products/placeholder-black-marble.jpg'],
  });

  await seedProduct({
    name: { en: 'Linen Fabric Panel', fr: 'Panneau effet tissu lin', ar: 'لوح بنسيج الكتان' },
    description: {
      en: 'Soft linen-textured acoustic PVC panel, great for offices.',
      fr: 'Panneau acoustique en PVC à texture lin doux, parfait pour les bureaux.',
      ar: 'لوح صوتي من PVC بنسيج الكتان الناعم، رائع للمكاتب.',
    },
    price: 169.9,
    category: fabric._id,
    images: ['/uploads/products/placeholder-linen-fabric.jpg'],
  });

  await seedProduct({
    name: { en: 'Matte White Unicolor Panel', fr: 'Panneau unicolore blanc mat', ar: 'لوح أحادي اللون أبيض مطفي' },
    description: {
      en: 'Clean matte white panel for a minimalist, versatile finish.',
      fr: 'Panneau blanc mat épuré pour une finition minimaliste et polyvalente.',
      ar: 'لوح أبيض مطفي أنيق لإنهاء بسيط ومتعدد الاستخدامات.',
    },
    price: 99.9,
    category: unicolor._id,
    images: ['/uploads/products/placeholder-matte-white.jpg'],
  });

  console.log('[seed] Done.');
  await mongoose.connection.close();
  process.exit(0);
}

main().catch((error) => {
  console.error('[seed] Failed:', error);
  process.exit(1);
});
