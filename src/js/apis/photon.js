// http://photon.komoot.io/
// https://github.com/komoot/photon

import BaseApi from '@/js/apis/BaseApi';

class Photon extends BaseApi {
  constructor() {
    super('https://photon.komoot.io/api/');
  }
}

Photon.prototype.getPropositions = function (query, lang, centerWgs84) {
  let params = {
    q: query,
  };

  if (centerWgs84) {
    params.lon = centerWgs84[0];
    params.lat = centerWgs84[1];
  }
  // only english, german and french languages are supported
  if (['en', 'de', 'fr'].includes(lang)) {
    params = { ...params, lang };
  }

  return this.get('/', { params });
};

Photon.prototype.reverseGeocodeUserLocation = function (lon, lat, lang) {
  return fetch(`https://photon.komoot.io/reverse?lon=${lon}&lat=${lat}&lang=${lang}`);
};

export default new Photon();
