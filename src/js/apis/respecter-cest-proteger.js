import axios from 'axios'

function RespecterCestProteger() {
    this.axios = axios.create()
}

RespecterCestProteger.prototype.fetchData = function(extent, mapWidth, mapHeight, language) {
    if (language !== 'fr' && language !== 'de' && language !== 'it') {
        language = 'en'
    }

    const baseUrl = 'https://api3.geo.admin.ch/rest/services/api/MapServer/identify';

    const layers = 'all:' + ['ch.bafu.wrz-jagdbanngebiete_select', 'ch.bafu.wrz-wildruhezonen_portal'].join(',')
    const geometry = `${extent[0]},${extent[1]},${extent[2]},${extent[3]}`
    const geometryType = 'esriGeometryEnvelope'
    const geometryFormat = 'geojson'
    const mapExtent = `${extent[0]},${extent[1]},${extent[2]},${extent[3]}`
    const imageDisplay = `${mapWidth},${mapHeight},${window.devicePixelRatio}`
    const tolerance = 3

    const tranquilityZones = axios.get(`${baseUrl}?geometry=${geometry}&geometryType=${geometryType}&geometryFormat=${geometryFormat}&layers=${layers}&mapExtent=${mapExtent}&imageDisplay=${imageDisplay}&tolerance=${tolerance}&lang=${language}`)
    const faunaProtectionZones = axios.get('')

    return Promise.all(
        tranquilityZones,
        faunaProtectionZones
    )
}

export default new RespecterCestProteger()
