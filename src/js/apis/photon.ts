// http://photon.komoot.io/
// https://github.com/komoot/photon

import BaseApi from '@/js/apis/BaseApi';

type PhotonParams = { q: string; lon?: number; lat?: number; lang?: string };

class Photon extends BaseApi {
  constructor() {
    super('https://photon.komoot.io/api/');
  }

  getPropositions(query: string, lang: string, centerWgs84?: [number, number]) {
    const params: PhotonParams = {
      q: query,
    };

    if (centerWgs84) {
      params.lon = centerWgs84[0];
      params.lat = centerWgs84[1];
    }
    // only english, german and french languages are supported
    if (['en', 'de', 'fr'].includes(lang)) {
      params.lang = lang;
    }

    return this.get('/', { params });
  }

  reverseGeocodeUserLocation(lon: number, lat: number, lang: string) {
    return fetch(`https://photon.komoot.io/reverse?lon=${lon}&lat=${lat}&lang=${lang}`);
  }
}

export default new Photon();
