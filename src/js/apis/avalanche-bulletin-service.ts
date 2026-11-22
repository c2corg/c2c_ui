import axios, { type AxiosInstance } from 'axios';

import config from '@/js/config';

// The avalanche bulletins of the c2c API, as CAAML v6 (the EAWS format): the French massifs only for now, with what
// CAAML has no field for in customData.MeteoFrance.

export type DangerRatingValue = 'low' | 'moderate' | 'considerable' | 'high' | 'very_high' | 'no_snow' | 'no_rating';
export type ValidTimePeriod = 'all_day' | 'earlier' | 'later';
export type Elevation = { lowerBound?: string; upperBound?: string };
export type Texts = { highlights?: string; comment?: string };
export type ValidTime = { startTime: string; endTime: string };

export type DangerRating = {
  mainValue: DangerRatingValue;
  validTimePeriod?: ValidTimePeriod;
  elevation?: Elevation;
  aspects?: string[];
};

export type AvalancheProblem = {
  problemType: string;
  validTimePeriod?: ValidTimePeriod;
  elevation?: Elevation;
  aspects?: string[];
  comment?: string;
};

export type Tendency = Texts & {
  tendencyType?: 'decreasing' | 'steady' | 'increasing';
  validTime?: ValidTime;
  customData?: { MeteoFrance?: { maxDangerRating?: DangerRatingValue } };
};

export type SnowCover = {
  date?: string;
  limitNorth?: number;
  limitSouth?: number;
  levels?: { elevation: number; north?: number; south?: number }[];
};

export type NewSnow = {
  elevation?: number;
  days?: { date: string; min?: number; max?: number; precipitation?: number }[];
};

export type Wind = { direction?: string; speed?: number };

export type WeatherForecast = {
  time: string;
  wind?: Wind[];
  freezingLevel?: number;
  rainSnowLimit?: number;
};

export type MeteoFranceData = {
  headline?: string;
  maxDangerRating?: DangerRatingValue;
  elevationThreshold?: number;
  dangerComment?: string;
  avalancheProneLocation?: { aspects?: string[]; comment?: string };
  naturalAvalanches?: string;
  triggeredAvalanches?: string;
  snowCover?: SnowCover;
  newSnow?: NewSnow;
  weather?: { windElevations?: (number | null)[]; forecasts?: WeatherForecast[] };
  history?: { maxDangerRatings?: { date: string; value: DangerRatingValue }[] };
};

export type AvalancheBulletin = {
  bulletinID: string;
  lang?: string;
  publicationTime?: string;
  validTime?: ValidTime;
  unscheduled?: boolean;
  source?: { provider?: { name?: string; website?: string } };
  regions: { regionID: string; name?: string }[];
  highlights?: string;
  dangerRatings?: DangerRating[];
  avalancheProblems?: AvalancheProblem[];
  avalancheActivity?: Texts;
  snowpackStructure?: Texts;
  weatherForecast?: Texts;
  travelAdvisory?: Texts;
  tendency?: Tendency[];
  // ALBINA.mainDate: the day the bulletin is valid for
  customData?: { ALBINA?: { mainDate?: string }; MeteoFrance?: MeteoFranceData };
};

export type AvalancheBulletins = { bulletins: AvalancheBulletin[] };

class AvalancheBulletinService {
  axios: AxiosInstance;

  constructor() {
    this.axios = axios.create({ baseURL: config.urls.api });
  }

  /** The last bulletins published for an EAWS region (FR-01 to FR-74 for now): none out of season */
  getLatestBulletins(regionId: string) {
    return this.axios
      .get<AvalancheBulletins>(`/avalanche-bulletins/regions/${regionId}/latest`)
      .then((response) => response.data.bulletins);
  }

  /** The official PDF, through the API: the key of Météo-France stays on the server */
  pdfUrl(regionId: string) {
    return `${config.urls.api}/avalanche-bulletins/regions/${regionId}/latest/pdf`;
  }
}

export default new AvalancheBulletinService();
