import { SiteSettingsDocument, SiteSettingsModel, SITE_SETTINGS_KEY } from '../models/siteSettings.model';
import {
  DEFAULT_CTA,
  DEFAULT_DECORS,
  DEFAULT_DECORS_SECTION,
  DEFAULT_HERO,
  DEFAULT_STRENGTHS,
  DEFAULT_STRENGTHS_SECTION,
} from '../constants/siteSettingsDefaults';
import BaseRepository from './base.repository';

class SiteSettingsRepository extends BaseRepository<SiteSettingsDocument> {
  constructor() {
    super(SiteSettingsModel);
  }

  /**
   * Returns the single settings row, creating it with the built-in defaults on first read.
   * `upsert` on the unique `key` guards against a race between two concurrent first reads
   * creating two rows.
   */
  async getOrCreate(): Promise<SiteSettingsDocument> {
    return this.model.findOneAndUpdate(
      { key: SITE_SETTINGS_KEY },
      {
        $setOnInsert: {
          key: SITE_SETTINGS_KEY,
          hero: DEFAULT_HERO,
          strengthsSection: DEFAULT_STRENGTHS_SECTION,
          strengths: DEFAULT_STRENGTHS,
          decorsSection: DEFAULT_DECORS_SECTION,
          decors: DEFAULT_DECORS,
          cta: DEFAULT_CTA,
        },
      },
      { upsert: true, new: true },
    );
  }
}

export const siteSettingsRepository = new SiteSettingsRepository();
