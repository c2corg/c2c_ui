// The layers built on IconLayer: <icon-layer ref="iconLayer"> does the map work
import type Feature from 'ol/Feature';
import type BaseLayer from 'ol/layer/Base';
import { useTemplateRef } from 'vue';

type IconLayer = {
  getLayer: () => BaseLayer;
  onMapClick: (evt: unknown, feature: Feature) => unknown;
  onMapLooseClick: () => unknown;
  onMapPointerMove: (evt: unknown, feature: Feature) => unknown;
  onMapLoosePointerMove: () => unknown;
};

export function useIconLayer() {
  const iconLayer = useTemplateRef<IconLayer>('iconLayer');

  return {
    getLayer: () => iconLayer.value!.getLayer(),
    onMapClick: (evt: unknown, feature: Feature) => iconLayer.value!.onMapClick(evt, feature),
    onMapLooseClick: () => iconLayer.value!.onMapLooseClick(),
    onMapPointerMove: (evt: unknown, feature: Feature) => iconLayer.value!.onMapPointerMove(evt, feature),
    onMapLoosePointerMove: () => iconLayer.value!.onMapLoosePointerMove(),
  };
}
