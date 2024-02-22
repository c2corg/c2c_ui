import axios from 'axios';
import { buildWebStorage, setupCache } from 'axios-cache-interceptor';

function YetiService() {
  this.axios = axios.create({ baseURL: 'https://api.ensg.eu/' });
  setupCache(this.axios, { storage: buildWebStorage(localStorage, 'yeti-cache') });
}

YetiService.prototype.zonesBra = function () {
  return this.axios.get('/zonesbra', { cache: { cacheTakeover: false, ttl: 1000 * 60 * 60 * 24 * 7 /* 7 days */ } });
};

YetiService.prototype.bra = function () {
  return this.axios.get('/bra', { cache: { cacheTakeover: false, ttl: 1000 * 60 * 60 /* 1 hour */ } });
};

export default new YetiService();
