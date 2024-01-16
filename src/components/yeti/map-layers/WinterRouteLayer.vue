<script>
import layerMixin from './layer';

import Yetix from '@/components/yeti/Yetix';
import ol from '@/js/libs/ol';

export default {
  mixins: [layerMixin],
  computed: {
    showWinterRoute() {
      return Yetix.showWinterRoute;
    },
    layerSelector() {
      return {
        title: this.$gettext('Winter hiking routes'),
        checked: this.showWinterRoute,
        action: this.onShowWinterRoute,
        image: 'winter-route.png',
        country: 'fr',
      };
    },
  },
  watch: {
    showWinterRoute() {
      this.updateVisibility();
    },
  },
  created() {
    this.layer = new ol.layer.Tile({});
  },
  mounted() {
    // add layer first (maintain order)
    this.map.addLayer(this.layer);

    // then  set source
    this.layer.setSource(
      new ol.source.TileWMS({
        url: 'https://api.ensg.eu/geoserver/yeti/wms',
        params: { LAYERS: 'yeti:TRACERANDOHIVERNALE' },
        attributions: '<a href="https://www.petzl.com/fondation/s/?language=fr">© PETZL</a>',
      })
    );
    this.updateVisibility();
    this.$emit('layer', this.layerSelector);
  },
  methods: {
    onShowWinterRoute() {
      Yetix.setShowWinterRoute(!this.showWinterRoute);
    },
    updateVisibility() {
      this.layer.setVisible(this.showWinterRoute);
      if (this.showWinterRoute) {
        // set legend
        this.setLegend();
      } else {
        Yetix.setWinterRouteLegend(null);
      }
    },
    setLegend() {
      let legend = [
        {
          title: this.$gettext('Winter hiking routes'),
          image: 'winter-route-icon1.png',
        },
        {
          title: this.$gettext('Tricky sections'),
          text: this.$gettext(
            'Some routes feature tricky sections where there is a risk of slipping dangerously (risk of impact or falling from a great height), falling into crevasses, collapsing seracs or drowning after falling through the ice on a mountain lake. To reduce the risk of slipping, it is often advisable to progress on foot, wearing crampons and suitably secured with rope.'
          ),
          image: 'winter-route-icon2.png',
        },
      ];
      Yetix.setWinterRouteLegend(legend);
    },
  },
  render() {
    return null;
  },
};
</script>
