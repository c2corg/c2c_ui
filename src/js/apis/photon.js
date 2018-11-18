// http://photon.komoot.de/
// https://github.com/komoot/photon


import BaseApi from '@/js/apis/BaseApi.js'


function Photon(){

    BaseApi.call(this, 'https://photon.komoot.de/api/')
}

// inherits prototype
Photon.prototype = Object.create(BaseApi.prototype);

// restore good contructor
Photon.prototype.constructor = Photon

Photon.prototype.getPropositions = function(query, lang, centerWgs84){
    const params = {
        q:query,
        lang:lang,
        lon: centerWgs84[0],
        lat: centerWgs84[1]
    }

    return this.get('/', {params})
}

export default new Photon()
