<script>
import layerMixin from './layer';

import Yetix from '@/components/yeti/Yetix';
import WinterRouteLayerContent from '@/components/yeti/map-layers/WinterRouteLayerContent';
import WinterRouteLayerContentTitle from '@/components/yeti/map-layers/WinterRouteLayerContentTitle';
import ol from '@/js/libs/ol';

export default {
  mixins: [layerMixin],
  computed: {
    showWinterRoute() {
      return Yetix.showWinterRoute;
    },
    winterRoutes() {
      return Yetix.winterRoutes;
    },
    layerSelector() {
      return {
        id: 'winter-route',
        title: this.$gettext('Winter hiking routes'),
        checked: this.showWinterRoute,
        action: this.onShowWinterRoute,
        image: 'winter-route.png',
        country: 'fr',
        contentComponent: WinterRouteLayerContent,
        contentTitleComponent: WinterRouteLayerContentTitle,
      };
    },
  },
  watch: {
    showWinterRoute() {
      this.updateVisibility();
    },
    winterRoutes() {
      if (this.winterRoutes.length === 0) {
        this.selectedLayer.getSource().clear();
      }
    },
    layerSelector() {
      this.$emit('layer', this.layerSelector);
    },
  },
  created() {
    this.layer = new ol.layer.Tile({
      name: 'winterRouteLayer',
      extent: ol.proj.transformExtent([5.44835, 44.18934, 7.1925, 46.30256], 'EPSG:4326', 'EPSG:3857'),
    });
    let pWidth = 4;
    this.selectedLayer = new ol.layer.Vector({
      source: new ol.source.Vector(),
      style: [
        new ol.style.Style({
          stroke: new ol.style.Stroke({
            color: 'hsla(10deg, 95%, 50%, 0.5)',
            //color: 'rgba(30, 30, 30, 0.6)',
            width: pWidth + 12,
          }),
        }),
        new ol.style.Style({
          stroke: new ol.style.Stroke({
            color: 'rgba(30, 30, 30, 1)',
            width: pWidth,
          }),
        }),
      ],
    });
  },
  mounted() {
    // add layer first (maintain order)
    this.map.addLayer(this.layer);
    this.map.addLayer(this.selectedLayer);

    // then  set source
    this.layer.setSource(
      new ol.source.TileWMS({
        url: 'https://api.ensg.eu/geoserver/yeti/wms',
        params: { LAYERS: 'yeti:TRACERANDOHIVERNALE' },
        attributions: '<a href="https://www.petzl.com/fondation/s/?language=fr">© PETZL</a>',
        crossOrigin: 'anonymous',
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
      this.selectedLayer.setVisible(this.showWinterRoute);
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
    onMapClick(evt) {
      let url = this.layer.getSource().getFeatureInfoUrl(evt.coordinate, this.view.getResolution(), 'EPSG:3857', {
        INFO_FORMAT: 'application/json',
        QUERY_LAYERS: 'yeti:TRACERANDOHIVERNALEFUSION',
        LAYERS: 'yeti:TRACERANDOHIVERNALEFUSION',
      });
      if (url) {
        fetch(url)
          .then((response) => response.json())
          .then((json) => {
            // if not shift key, first remove all features
            if (!evt.originalEvent.shiftKey) {
              Yetix.setWinterRoutes([]);
            }
            // then, if new feature
            this.$nextTick(() => {
              if (json.features.length) {
                let features = new ol.format.GeoJSON().readFeatures(json);
                // getFeatureInfo returns only one
                let feature = features[0];
                // feature already there
                let isSameFeature = false;
                this.selectedLayer.getSource().forEachFeature((_feature) => {
                  if (_feature.get('id') === feature.get('id')) {
                    isSameFeature = true;
                    // remove if shift key
                    if (evt.originalEvent.shiftKey) {
                      this.selectedLayer.getSource().removeFeature(_feature);
                    }
                  }
                });
                if (!isSameFeature) {
                  this.selectedLayer.getSource().addFeature(feature);
                }
              }
              // set features
              let features = this.selectedLayer.getSource().getFeatures();
              Yetix.setWinterRoutes(features);
            });
          });
      }
    },
    onMapLooseClick() {
      // clear
      Yetix.setWinterRoutes([]);
    },
    onMapPointerMove() {
      this.map.getTargetElement().style.cursor = 'pointer';
    },
    onMapLoosePointerMove() {
      this.map.getTargetElement().style.cursor = '';
    },
  },
  render() {
    return null;
  },
};
</script>
