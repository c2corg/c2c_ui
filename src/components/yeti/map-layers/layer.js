import ol from '@/js/libs/ol';

export default {
  computed: {
    map() {
      // store parent map
      return this.$parent.map;
    },
    view() {
      return this.map.getView();
    },
  },
  methods: {
    getExtent(projection) {
      return this.$parent.getExtent(projection);
    },
    getFeaturesFromData(data) {
      let features = data.data;
      // read geoJSON, and project to 3857 (geoJSON is 4326 by default)
      return new ol.format.GeoJSON().readFeatures(features, { featureProjection: 'EPSG:3857' });
    },
    getPropertiesFromFeatures(features) {
      return features.map((feature) => {
        return feature.getProperties();
      });
    },
  },
};
