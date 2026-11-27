// Registers the Swiper custom elements (<swiper-container>, <swiper-slide>, declared in vite.config.ts) when first
// imported, by the components that use them: Swiper stays out of the startup bundle (#4877)
import { register } from 'swiper/element';

register();
