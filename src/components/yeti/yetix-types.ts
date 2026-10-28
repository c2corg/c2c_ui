// The shapes of the Yetix state
import type MultiPolygon from 'ol/geom/MultiPolygon';
import type { Component } from 'vue';

// a layer of the base, slopes, overlays or yeti selectors: its button, and the layer it shows
export type SelectorLayer = {
  id?: string;
  title: string;
  checked: boolean;
  image?: string;
  country?: string;
  small?: boolean;
  opacity?: number;
  blendModes?: boolean;
  disabled?: { condition: boolean; title?: string; message?: string };
  action?: () => void;
  contentComponent?: Component;
  contentTitleComponent?: Component;
};

// a mountain of the avalanche bulletins (its properties), by massif
export type BulletinMountain = { mountain: string; name: string; geometry: MultiPolygon; urls: { url: string }[] };

// the legend of the yeti risk, from the yeti API: texts by language
export type YetiLegend = {
  items: { color: string; text: Record<string, string> }[];
  attributions: string[];
  comment: Record<string, string>;
};

// an item of the legend of the winter routes
export type WinterRouteLegendItem = { image: string; title: string; text?: string };

// a tab of the side panel
export type YetiTab = {
  id?: string;
  name?: string;
  title?: string;
  icon: string | string[];
  counter?: { title: string; text: string | number };
  problemIcon?: { title: string };
};
