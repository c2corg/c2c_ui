import axios from 'axios';


function BiodivSports(){
    this.url = 'https://biodiv-sports.fr/api/v2/sensitivearea/'
    this.axios = axios.create()
}

BiodivSports.prototype.fetchData = function(extent, activities, language) {

    if (language != 'fr' && language != 'en' && language != 'it') {
        language = 'en';
    }

    const params = {
        'in_bbox': `${extent[0]},${extent[1]},${extent[2]},${extent[3]}`,
        language,
        'fields': 'id,geometry,name,description,info_url,period,kml_url'
    };

    if (activities && activities.length > 0) {
        // select practices depending on activities
        const practices = [1, 2, 4]; // for anyone: Land, Vertical, Equipment
        if (activities.indexOf('paragliding') > 0) {
            practices.push(3); // Aérien
        }
        params['practices'] = practices.join(',');
    }

    return this.axios.get(this.url, {params});
};

export default new BiodivSports()
