import { BadRequestError } from '../errors';

export interface I18nText {
  en: string;
  fr: string;
  ar: string;
}

export interface PartialI18nText {
  en?: string;
  fr?: string;
  ar?: string;
}

// At least one language must be provided; the first non-empty value (en, then fr, then ar)
// backfills whichever languages were left blank.
export function resolveI18nText(input: PartialI18nText | undefined, fieldName: string): I18nText {
  const first = input?.en || input?.fr || input?.ar;
  if (!first) {
    throw new BadRequestError(`${fieldName} requires at least one language`, 'i18nText.helper.resolveI18nText');
  }
  return {
    en: input?.en || first,
    fr: input?.fr || first,
    ar: input?.ar || first,
  };
}
