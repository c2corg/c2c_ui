import axios, { type AxiosInstance } from 'axios';

import config from '@/js/config';

// The outings of the partner sites (skitour.fr, gulliver.it...) harvested by the API, merged with those of c2c:
// GET /partner-outings and GET /partner-outings/sources.

export type PartnerOutingRating = {
  ski_rating_min: string | null;
  ski_rating_max: string | null;
  // the rating as the source writes it
  raw: string | null;
  // the scale of `raw`: 'c2c_ski' for the ski ratings of c2c, otherwise that of the source
  system: string | null;
};

export type PartnerOuting = {
  // '<source>:<id on the source>', 'c2c:<document_id>' for the outings of c2c
  id: string;
  // name of a source of the registry, or 'c2c'
  source: string;
  // set for the outings of c2c only
  document_id: number | null;
  // the page on the partner site; null for the outings of c2c (the UI routes to the outing)
  url: string | null;
  title: string;
  lang: string | null;
  // YYYY-MM-DD
  date: string;
  author: { name: string | null; url: string | null } | null;
  activities: string[];
  // the activity as the source names it, when it maps to none of ours
  source_activity: string | null;
  rating: PartnerOutingRating | null;
  steep: boolean | null;
  elevation_max: number | null;
  height_diff_up: number | null;
  orientations: string[];
  snow: string | null;
  region: string | null;
  // `geom` is a GeoJSON string in EPSG:3857; `quality` tells how precise the location is ('summit' is the best)
  geometry: { geom: string; quality: string } | null;
  areas: { document_id: number; area_type: string; title: string }[];
  credit: { site: string; site_url: string };
};

export type PartnerSourceHealth = {
  source: string;
  status: string;
  last_success_at: string | null;
  // only in GET /partner-outings/sources
  site_name?: string;
  site_url?: string;
  status_detail?: string | null;
  last_run_at?: string | null;
  last_fetched?: number | null;
  last_skipped?: number | null;
};

export type PartnerOutingsAnswer = {
  total: number;
  items: PartnerOuting[];
  sources: PartnerSourceHealth[];
};

export type PartnerOutingsQuery = {
  // area ids
  a?: number[];
  // activities
  act?: string[];
  // 'YYYY-MM-DD' or 'start,end'; the API defaults to the last 14 days
  date?: string;
  // names of sources, 'c2c' included; the API defaults to all
  sources?: string[];
  limit?: number;
  offset?: number;
  // the language of the titles of c2c and of the area names
  pl?: string;
};

class PartnerOutingsService {
  axios: AxiosInstance;

  constructor() {
    this.axios = axios.create({ baseURL: config.urls.api });
  }

  /** The query parameters of the API: arrays comma separated, the empty ones left out */
  params(query: PartnerOutingsQuery) {
    const params: Record<string, string | number> = {};
    const lists = { a: query.a, act: query.act, sources: query.sources };
    for (const [name, list] of Object.entries(lists)) {
      if (list?.length) {
        params[name] = list.join(',');
      }
    }
    if (query.date) {
      params.date = query.date;
    }
    if (query.pl) {
      params.pl = query.pl;
    }
    if (query.limit !== undefined) {
      params.limit = query.limit;
    }
    if (query.offset !== undefined) {
      params.offset = query.offset;
    }
    return params;
  }

  getAll(query: PartnerOutingsQuery = {}, signal?: AbortSignal) {
    return this.axios
      .get<PartnerOutingsAnswer>('/partner-outings', { params: this.params(query), signal })
      .then((response) => response.data);
  }

  getSources(signal?: AbortSignal) {
    return this.axios
      .get<PartnerSourceHealth[] | { sources: PartnerSourceHealth[] }>('/partner-outings/sources', { signal })
      .then((response) => (Array.isArray(response.data) ? response.data : response.data.sources));
  }
}

export default new PartnerOutingsService();
