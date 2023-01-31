import axios from 'axios';

function BiodivSportsService() {
  this.axios = axios.create({ baseURL: 'https://biodiv-sports.fr/api/v2' });
}

BiodivSportsService.prototype.fetchData = function (extent, activities, language) {
  if (language !== 'fr' && language !== 'en' && language !== 'it') {
    language = 'en';
  }

  const params = {
    in_bbox: `${extent[0]},${extent[1]},${extent[2]},${extent[3]}`,
    language,
    fields: 'id,geometry,name,description,info_url,period,kml_url',
  };

  if (activities?.length) {
    // select practices depending on activities
    const practices = [1, 2, 4]; // for anyone: Land, Vertical, Equipment
    if (activities.includes('paragliding')) {
      practices.push(3); // Aérien
    }
    params['practices'] = practices.join(',');
  }

  return this.axios.get('/sensitivearea/', { params });
};

export default new BiodivSportsService();
