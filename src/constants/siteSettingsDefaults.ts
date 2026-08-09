import { CtaSection, DecorsSection, HeroSection, StrengthsSection } from '../models/siteSettings.model';

// Seeds the singleton SiteSettings row the first time it's read (see
// siteSettings.repository.ts#getOrCreate), mirroring the copy that used to be hardcoded in
// each client's i18n locale files, so a fresh install renders the same home page it always
// did until an admin edits it. Images start empty — both clients fall back to a bundled
// placeholder asset (hero) or an empty-state box (décor items) until an admin uploads one,
// the same "no image yet" convention already used for product photos.
export const DEFAULT_HERO: HeroSection = {
  eyebrow: { en: 'The perfect interior solution', fr: 'Solution intérieure parfaite', ar: 'الحل الداخلي الأمثل' },
  titleLine1: { en: "We're ready", fr: 'Nous sommes prêts', ar: 'نحن جاهزون' },
  titleAccent: { en: 'to decorate your space', fr: 'à décorer votre espace', ar: 'لتزيين مساحتك' },
  intro: {
    en: 'DeLAPLAK designs decorative PVC wall panels for homes, offices, hospitality and more — a durable, elegant finish for every project.',
    fr: "DeLAPLAK conçoit des panneaux muraux décoratifs en PVC pour l'habitat, les bureaux, l'hôtellerie et bien plus — une finition durable et élégante pour chaque projet.",
    ar: 'تصمم ديلابلاك ألواح جدارية مزخرفة من PVC للمنازل والمكاتب والفنادق وأكثر — لمسة نهائية متينة وأنيقة لكل مشروع.',
  },
  ctaPrimaryLabel: { en: 'Browse the catalog', fr: 'Découvrez le catalogue', ar: 'تصفح الكتالوج' },
  ctaSecondaryLabel: { en: 'My profile', fr: 'Mon profil', ar: 'ملفي الشخصي' },
  mainImage: '',
  accentImage: '',
};

export const DEFAULT_STRENGTHS_SECTION: StrengthsSection = {
  eyebrow: { en: 'Why DeLAPLAK', fr: 'Pourquoi DeLAPLAK', ar: 'لماذا ديلابلاك' },
  title: { en: 'Why choose DeLAPLAK', fr: 'Pourquoi choisir DeLAPLAK', ar: 'لماذا تختار ديلابلاك' },
};

export const DEFAULT_STRENGTHS: { text: { en: string; fr: string; ar: string } }[] = [
  {
    text: {
      en: 'High-density PVC panels, resistant to moisture and impact',
      fr: "Panneaux PVC haute densité, résistants à l'humidité et aux chocs",
      ar: 'ألواح PVC عالية الكثافة، مقاومة للرطوبة والصدمات',
    },
  },
  {
    text: {
      en: 'A wide choice of wood, marble and solid-color finishes',
      fr: 'Un large choix de décors bois, marbre et unis',
      ar: 'تشكيلة واسعة من التشطيبات الخشبية والرخامية والموحدة اللون',
    },
  },
  {
    text: {
      en: "A durable finish that won't fade over time",
      fr: 'Une finition durable qui ne se décolore pas dans le temps',
      ar: 'تشطيب متين لا يبهت مع مرور الوقت',
    },
  },
  {
    text: {
      en: 'Personalized support, from quote to delivery',
      fr: 'Un accompagnement personnalisé, du devis à la livraison',
      ar: 'مرافقة شخصية، من عرض السعر إلى التسليم',
    },
  },
];

export const DEFAULT_DECORS_SECTION: DecorsSection = {
  eyebrow: { en: 'Our finishes', fr: 'Nos décors', ar: 'تشطيباتنا' },
  title: { en: 'Explore our finishes', fr: 'Découvrez nos décors', ar: 'اكتشف تشطيباتنا' },
  discoverLabel: { en: 'Discover', fr: 'Découvrir', ar: 'اكتشف' },
};

export const DEFAULT_DECORS: { title: { en: string; fr: string; ar: string }; image: string }[] = [
  { title: { en: 'Prestige Walnut', fr: 'Prestige Walnut', ar: 'Prestige Walnut' }, image: '' },
  { title: { en: 'Mocha Wood', fr: 'Mocha Wood', ar: 'Mocha Wood' }, image: '' },
  { title: { en: 'Sereno Oak', fr: 'Sereno Oak', ar: 'Sereno Oak' }, image: '' },
  { title: { en: 'Chêne Vanillia', fr: 'Chêne Vanillia', ar: 'Chêne Vanillia' }, image: '' },
  { title: { en: 'Gris Moineau', fr: 'Gris Moineau', ar: 'Gris Moineau' }, image: '' },
  { title: { en: 'Japandi', fr: 'Japandi', ar: 'Japandi' }, image: '' },
];

export const DEFAULT_CTA: CtaSection = {
  title: { en: 'Ready to transform your space?', fr: 'Prêt à transformer votre espace ?', ar: 'هل أنت مستعد لتحويل مساحتك؟' },
  actionLabel: { en: 'View the catalog', fr: 'Consultez le catalogue', ar: 'عرض الكتالوج' },
};
