import axios, { type AxiosInstance } from 'axios';

class YetiService {
  axios: AxiosInstance;

  constructor() {
    this.axios = axios.create({ baseURL: 'https://api.ensg.eu/' });
  }

  zonesBra() {
    return this.axios.get('/zonesbra');
  }

  bra() {
    return this.axios.get('/bra');
  }
}

export default new YetiService();
