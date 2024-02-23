import axios from 'axios';

function YetiService() {
  this.axios = axios.create({ baseURL: 'https://api.ensg.eu/' });
}

YetiService.prototype.zonesBra = function () {
  return this.axios.get('/zonesbra');
};

YetiService.prototype.bra = function () {
  return this.axios.get('/bra');
};

export default new YetiService();
