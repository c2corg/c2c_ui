// Outings as GET /partner-outings answers them, for the specs of the page.
import type { PartnerOuting, PartnerSourceHealth } from '@/js/apis/partner-outings-service';

export const partnerOuting = (overrides: Partial<PartnerOuting> = {}): PartnerOuting => ({
  id: 'gulliver:1',
  source: 'gulliver',
  document_id: null,
  url: 'https://gulliver.it/gita/1/',
  title: 'Monte Rosa',
  lang: 'it',
  date: '2026-02-14',
  author: { name: 'Marco', url: null },
  activities: ['skitouring'],
  source_activity: null,
  rating: { ski_rating_min: null, ski_rating_max: null, raw: 'BS', system: 'cai' },
  steep: null,
  elevation_max: null,
  height_diff_up: null,
  orientations: [],
  snow: null,
  region: null,
  geometry: null,
  areas: [{ document_id: 14, area_type: 'range', title: 'Monte Rosa' }],
  credit: { site: 'Gulliver', site_url: 'https://gulliver.it' },
  ...overrides,
});

export const c2cOuting = (overrides: Partial<PartnerOuting> = {}): PartnerOuting =>
  partnerOuting({
    id: 'c2c:77',
    source: 'c2c',
    document_id: 77,
    url: null,
    title: 'Pointe de Chalune',
    lang: 'fr',
    author: { name: 'Alice', url: null },
    rating: { ski_rating_min: '2.1', ski_rating_max: '3.2', raw: null, system: 'c2c_ski' },
    areas: [{ document_id: 3, area_type: 'admin_limits', title: 'Haute-Savoie' }],
    credit: { site: 'camptocamp.org', site_url: 'https://www.camptocamp.org' },
    ...overrides,
  });

export const sources: PartnerSourceHealth[] = [
  { source: 'gulliver', status: 'ok', last_success_at: '2026-02-14T09:00:00Z', site_name: 'Gulliver' },
  { source: 'skitour', status: 'down', last_success_at: null, site_name: 'Skitour' },
];
