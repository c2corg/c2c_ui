<script>
import axios from 'axios';

import layerMixin from './layer';

import ol from '@/js/libs/ol';

const YETI_URL_MOUNTAINS = '/mountains_WGS84.json';

export default {
  mixins: [layerMixin],
  inject: ['$yetix'],
  mounted() {
    axios.get(YETI_URL_MOUNTAINS).then(this.onMountainsResult);
    this.map.on('moveend', this.onMapMoveEnd);
  },
  methods: {
    onMountainsResult(data) {
      const features = data.data;
      let mountains = new ol.format.GeoJSON().readFeatures(features).map((mountain) => {
        return mountain.getProperties();
      });
      this.allMountains = this.sortMountainsByMassif(mountains);
      this.setVisibleMountains();
    },
    sortMountainsByMassif(mountains) {
      // first, order mountains by massifs
      const sortedMountains = {};
      for (let i = 0; i < mountains.length; i++) {
        if (!sortedMountains[mountains[i].mountain]) {
          sortedMountains[mountains[i].mountain] = [];
        }
        sortedMountains[mountains[i].mountain].push(mountains[i]);
      }
      mountains = sortedMountains;

      // then sort mountains inside each massif
      for (const i in mountains) {
        mountains[i].sort((a, b) => {
          if (a.title < b.title) return -1;
          if (b.title > a.title) return 1;
          return 0;
        });
      }

      return mountains;
    },
    setVisibleMountains() {
      // return, if mountains not loaded
      if (!this.allMountains) {
        return;
      }
      const mapExtent = this.getExtent('EPSG:4326');
      // clone this.mountains first, with no reference
      const visibleMountains = Object.assign({}, this.allMountains);
      // then filter if polygon isn’t in view
      for (const massif in visibleMountains) {
        visibleMountains[massif] = visibleMountains[massif].filter((mountain) => {
          const polygon = mountain.geometry;
          return polygon.intersectsExtent(mapExtent);
        });
        // unset massif if empty
        if (visibleMountains[massif].length === 0) {
          delete visibleMountains[massif];
        }
      }
      // set mountains in visibleMountains key
      const mountains = { visibleMountains };
      this.$yetix.$emit('mountains', mountains);
    },
    onMapMoveEnd() {
      // set visible mountains
      this.setVisibleMountains();
    },
  },
  render() {
    return null;
  },
};
</script>
