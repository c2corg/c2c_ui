// http://photon.komoot.de/
// https://github.com/komoot/photon

import BaseApi from '@/js/apis/BaseApi.js';

function Photon() {
  BaseApi.call(this, 'https://photon.komoot.de/api/');
}

// inherits prototype
Photon.prototype = Object.create(BaseApi.prototype);

// restore good contructor
Photon.prototype.constructor = Photon;

Photon.prototype.getPropositions = function (query, lang, centerWgs84) {
  let params = {
    q: query,
    lon: centerWgs84[0],
    lat: centerWgs84[1],
  };
  // only english, german, french and italian languages are supported
  if (['en', 'de', 'fr', 'it'].includes(lang)) {
    params = { ...params, lang };
  }

  return this.get('/', { params });
};

export default new Photon();
