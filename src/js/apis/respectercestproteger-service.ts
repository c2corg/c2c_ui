import axios, { type AxiosInstance } from 'axios';

const layers = 'all:' + ['ch.bafu.wrz-jagdbanngebiete_select', 'ch.bafu.wrz-wildruhezonen_portal'].join(',');

type Extent = [number, number, number, number];

class RespecterCestProtegerService {
  axios: AxiosInstance;

  constructor() {
    this.axios = axios.create({ baseURL: 'https://api3.geo.admin.ch/rest/services/api/MapServer' });
  }

  identify(position: [number, number], extent: Extent, mapWidth: number, mapHeight: number, language: string) {
    if (!['fr', 'de', 'it'].includes(language)) {
      language = 'en';
    }

    const geometry = `${position[0]},${position[1]}`;
    const geometryType = 'esriGeometryPoint';
    const geometryFormat = 'geojson';
    const spatialReference = '3857';
    const mapExtent = `${extent[0]},${extent[1]},${extent[2]},${extent[3]}`;
    const dpi = window.devicePixelRatio * 96;
    const imageDisplay = `${mapWidth},${mapHeight},${dpi}`;
    const tolerance = 3;

    return this.axios.get(
      `/identify?geometry=${geometry}` +
        `&geometryType=${geometryType}` +
        `&geometryFormat=${geometryFormat}` +
        `&sr=${spatialReference}` +
        `&layers=${layers}` +
        `&mapExtent=${mapExtent}` +
        `&imageDisplay=${imageDisplay}` +
        `&tolerance=${tolerance}` +
        `&lang=${language}`
    );
  }

  hasArea(extent: Extent): Promise<boolean> {
    const geometry = `${extent[0]},${extent[1]},${extent[2]},${extent[3]}`;

    return this.axios
      .get<{ results?: unknown[] }>(
        `/identify?geometry=${geometry}` +
          `&geometryType=esriGeometryEnvelope` +
          `&returnGeometry=false` +
          `&layers=${layers}` +
          `&tolerance=0`
      )
      .then((response) => (response?.data?.results?.length ?? 0) > 0);
  }
}

export default new RespecterCestProtegerService();
