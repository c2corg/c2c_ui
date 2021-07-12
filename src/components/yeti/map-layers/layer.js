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
      let extent = this.view.calculateExtent(this.map.getSize() || null);
      if (projection) {
        extent = ol.proj.transformExtent(extent, ol.proj.get('EPSG:3857'), ol.proj.get(projection));
      }
      return extent;
    },
  },
};
