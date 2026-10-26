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
  bingApiKey?: string;
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
