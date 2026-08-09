import { siteSettingsRepository } from '../repositories';
import { NotFoundError } from '../errors';
import { resolveI18nText } from '../helpers';
import { UserDocument } from '../models/user.model';
import { UpdateSiteSettingsDto, StrengthItemDto, DecorItemDto } from '../types-server/siteSettings';
import { deleteSiteSettingsImageFile } from './upload.service';

export async function getPublic() {
  return siteSettingsRepository.getOrCreate();
}

export async function update({ payload, currentUser }: { payload: UpdateSiteSettingsDto; currentUser: UserDocument }) {
  const settings = await siteSettingsRepository.getOrCreate();

  if (payload.hero) {
    const { hero } = payload;
    if (hero.eyebrow) settings.hero.eyebrow = resolveI18nText(hero.eyebrow, 'hero.eyebrow');
    if (hero.titleLine1) settings.hero.titleLine1 = resolveI18nText(hero.titleLine1, 'hero.titleLine1');
    if (hero.titleAccent) settings.hero.titleAccent = resolveI18nText(hero.titleAccent, 'hero.titleAccent');
    if (hero.intro) settings.hero.intro = resolveI18nText(hero.intro, 'hero.intro');
    if (hero.ctaPrimaryLabel) settings.hero.ctaPrimaryLabel = resolveI18nText(hero.ctaPrimaryLabel, 'hero.ctaPrimaryLabel');
    if (hero.ctaSecondaryLabel) settings.hero.ctaSecondaryLabel = resolveI18nText(hero.ctaSecondaryLabel, 'hero.ctaSecondaryLabel');
  }

  if (payload.strengthsSection) {
    const { strengthsSection } = payload;
    if (strengthsSection.eyebrow) settings.strengthsSection.eyebrow = resolveI18nText(strengthsSection.eyebrow, 'strengthsSection.eyebrow');
    if (strengthsSection.title) settings.strengthsSection.title = resolveI18nText(strengthsSection.title, 'strengthsSection.title');
  }

  if (payload.decorsSection) {
    const { decorsSection } = payload;
    if (decorsSection.eyebrow) settings.decorsSection.eyebrow = resolveI18nText(decorsSection.eyebrow, 'decorsSection.eyebrow');
    if (decorsSection.title) settings.decorsSection.title = resolveI18nText(decorsSection.title, 'decorsSection.title');
    if (decorsSection.discoverLabel)
      settings.decorsSection.discoverLabel = resolveI18nText(decorsSection.discoverLabel, 'decorsSection.discoverLabel');
  }

  if (payload.cta) {
    const { cta } = payload;
    if (cta.title) settings.cta.title = resolveI18nText(cta.title, 'cta.title');
    if (cta.actionLabel) settings.cta.actionLabel = resolveI18nText(cta.actionLabel, 'cta.actionLabel');
  }

  settings.updatedBy = currentUser._id;
  await settings.save();
  return settings;
}

export async function addStrength({ payload, currentUser }: { payload: StrengthItemDto; currentUser: UserDocument }) {
  const settings = await siteSettingsRepository.getOrCreate();
  settings.strengths.push({ text: resolveI18nText(payload.text, 'text') } as any);
  settings.updatedBy = currentUser._id;
  await settings.save();
  return settings;
}

export async function updateStrength({
  itemId,
  payload,
  currentUser,
}: {
  itemId: string;
  payload: StrengthItemDto;
  currentUser: UserDocument;
}) {
  const settings = await siteSettingsRepository.getOrCreate();
  const item = settings.strengths.id(itemId);
  if (!item) {
    throw new NotFoundError('Strength item not found', 'siteSettings.service.updateStrength');
  }
  item.text = resolveI18nText(payload.text, 'text');
  settings.updatedBy = currentUser._id;
  await settings.save();
  return settings;
}

export async function removeStrength({ itemId, currentUser }: { itemId: string; currentUser: UserDocument }) {
  const settings = await siteSettingsRepository.getOrCreate();
  const item = settings.strengths.id(itemId);
  if (!item) {
    throw new NotFoundError('Strength item not found', 'siteSettings.service.removeStrength');
  }
  item.deleteOne();
  settings.updatedBy = currentUser._id;
  await settings.save();
  return settings;
}

export async function addDecor({ payload, currentUser }: { payload: DecorItemDto; currentUser: UserDocument }) {
  const settings = await siteSettingsRepository.getOrCreate();
  settings.decors.push({ title: resolveI18nText(payload.title, 'title'), image: '' } as any);
  settings.updatedBy = currentUser._id;
  await settings.save();
  return settings;
}

export async function updateDecor({
  itemId,
  payload,
  currentUser,
}: {
  itemId: string;
  payload: DecorItemDto;
  currentUser: UserDocument;
}) {
  const settings = await siteSettingsRepository.getOrCreate();
  const item = settings.decors.id(itemId);
  if (!item) {
    throw new NotFoundError('Décor item not found', 'siteSettings.service.updateDecor');
  }
  item.title = resolveI18nText(payload.title, 'title');
  settings.updatedBy = currentUser._id;
  await settings.save();
  return settings;
}

export async function removeDecor({ itemId, currentUser }: { itemId: string; currentUser: UserDocument }) {
  const settings = await siteSettingsRepository.getOrCreate();
  const item = settings.decors.id(itemId);
  if (!item) {
    throw new NotFoundError('Décor item not found', 'siteSettings.service.removeDecor');
  }
  if (item.image) deleteSiteSettingsImageFile(item.image);
  item.deleteOne();
  settings.updatedBy = currentUser._id;
  await settings.save();
  return settings;
}

export async function setHeroImage({
  slot,
  fileName,
  currentUser,
}: {
  slot: 'main' | 'accent';
  fileName: string;
  currentUser: UserDocument;
}) {
  const settings = await siteSettingsRepository.getOrCreate();
  const field = slot === 'main' ? 'mainImage' : 'accentImage';
  if (settings.hero[field]) deleteSiteSettingsImageFile(settings.hero[field]);
  settings.hero[field] = `/uploads/site-settings/${fileName}`;
  settings.updatedBy = currentUser._id;
  await settings.save();
  return settings;
}

export async function setDecorImage({
  itemId,
  fileName,
  currentUser,
}: {
  itemId: string;
  fileName: string;
  currentUser: UserDocument;
}) {
  const settings = await siteSettingsRepository.getOrCreate();
  const item = settings.decors.id(itemId);
  if (!item) {
    throw new NotFoundError('Décor item not found', 'siteSettings.service.setDecorImage');
  }
  if (item.image) deleteSiteSettingsImageFile(item.image);
  item.image = `/uploads/site-settings/${fileName}`;
  settings.updatedBy = currentUser._id;
  await settings.save();
  return settings;
}
