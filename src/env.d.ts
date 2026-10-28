// The build configuration, replaced at build time by the one of vite.config.mjs (define): see src/js/config.ts

interface UrlsConfiguration {
  name: string;
  api: string;
  media: string;
  imageBackend: string;
  forum: string;
  tracking?: string;
  miniatures?: string;
  recaptchaKey?: string;
  // images uploaded after this timestamp, or with a greater id, have webp and avif thumbnails (0: none)
  modernThumbnailsTimestamp: number;
  modernThumbnailsId: number;
  // OAuth of the activity trackers (tracking service)
  stravaConnectAuthUrl?: string;
  stravaClientId?: string;
  decathlonConnectAuthUrl?: string;
  decathlonClientId?: string;
  suuntoConnectAuthUrl?: string;
  suuntoClientId?: string;
  polarConnectAuthUrl?: string;
  polarClientId?: string;
  corosConnectAuthUrl?: string;
  corosClientId?: string;
}

interface BuildConfiguration {
  routerMode?: 'history';
  ordnanceSurveyApiKey: string;
  isBackendSelectable: boolean;
  addthisPublicId: string;
  googleAnalyticsKey: string;
  urlsConfigurations: Record<string, UrlsConfiguration>;
  urls: UrlsConfiguration;
  // GitHub Pages previews only
  branchName?: string;
  publicPath: string;
}

declare const CAMPTOCAMP_CONFIG: BuildConfiguration;

// Backend urls given when the container starts, over the ones of the build: see src/js/runtime-config.ts
interface RuntimeConfiguration {
  // one of the urlsConfigurations of the build, as the starting point
  backend?: string;
  urls?: Partial<UrlsConfiguration>;
}

interface Window {
  CAMPTOCAMP_RUNTIME_CONFIG?: RuntimeConfiguration;
}
