// CAMPTOCAMP_CONFIG is a placeholder defined in vue.config.js
// DO not modify this file. If you need another build parameter
// please go to vue.config.js in root

// CAMPTOCAMP_CONFIG is defined by webpack DefinePlugin.
// Here is the trick to declare this variable with TypeScript
// https://github.com/TypeStrong/ts-loader/issues/37
// note that it does not work with const, but why ???
declare var CAMPTOCAMP_CONFIG: any;

const LOCAL_STORAGE_KEY:string = 'SiteConfiguration.urlsName';

class Config {
    routerMode: string
    urls: any
    ignApiKey: string
    bingApiKey: string
    googleAnalyticsKey: string
    isProduction: boolean
    urlsConfigurations: any
    publicPath: string

    constructor() {
        const config = CAMPTOCAMP_CONFIG;

        this.routerMode = config.routerMode;
        this.ignApiKey = config.ignApiKey;
        this.bingApiKey = config.bingApiKey;
        this.googleAnalyticsKey = config.googleAnalyticsKey;
        this.isProduction = config.isProduction;
        this.urlsConfigurations = config.urlsConfigurations;
        this.publicPath = config.publicPath;

        const urlsName = window.localStorage.getItem(LOCAL_STORAGE_KEY) || config.urls.name;

        if (!this.isProduction) {
            this.urls = config.urlsConfigurations[urlsName];
        } else {
            this.urls = config.urls;
        }
    }

    setUrlsName(name: string):void {
        window.localStorage.setItem(LOCAL_STORAGE_KEY, name);
    }
}

export default new Config();
