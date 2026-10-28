// The shapes of the Yetix state that the components read (Yetix.vue is not typed yet)
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

// a mountain of an avalanche bulletin, by massif
export type BulletinMountain = { name: string; urls: { url: string }[] };
