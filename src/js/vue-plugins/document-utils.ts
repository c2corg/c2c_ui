/*
 * This module manipulate document objects
 * it does not provide any API service
 */

import type { App } from 'vue';

import c2c from '@/js/apis/c2c';
import constants from '@/js/constants';

// a locale of a document: its language, title...
export type Locale = { lang: string; title?: string | null; title_prefix?: string | null; [property: string]: unknown };

// a document of the API, as far as this module goes. Its other properties stay untyped until the API responses are
// typed (#4747)
export type C2cDocument = {
  type?: string;
  document_id?: number;
  locales?: Locale[];
  associations?: Record<string, C2cDocument[]>;
  geometry?: { geom?: string | null; geom_detail?: string | null } | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [property: string]: any;
};

export type DocumentUtils = ReturnType<typeof createDocumentUtils>;

declare module 'vue' {
  interface ComponentCustomProperties {
    $documentUtils: DocumentUtils;
  }
}

function createDocumentUtils(app: App) {
  // $gettext, $user and $dateUtils are read from app.config.globalProperties when called: they may be installed after this plugin
  const documentUtils = {
    getCreationTitle(documentType: string): string {
      if (documentType === 'outing') return app.config.globalProperties.$gettext('add an outing');
      if (documentType === 'route') return app.config.globalProperties.$gettext('add a route');
      if (documentType === 'image') return app.config.globalProperties.$gettext('add an image');
      if (documentType === 'waypoint') return app.config.globalProperties.$gettext('add a waypoint');
      if (documentType === 'map') return app.config.globalProperties.$gettext('add a map');
      if (documentType === 'xreport') return app.config.globalProperties.$gettext('add an incident/accident report');
      if (documentType === 'area') return app.config.globalProperties.$gettext('add an area');
      if (documentType === 'book') return app.config.globalProperties.$gettext('add a book');
      if (documentType === 'article') return app.config.globalProperties.$gettext('add an article');

      throw new Error(`Unexpected type : ${documentType}`);
    },

    getDocumentType(letterType: string | undefined): string {
      return constants.letterToDocumentType[letterType ?? ''];
    },

    getDocumentTitle(document: C2cDocument, lang?: string): string {
      // profile does not have locale, get profile's name
      if (document.type === 'u' || !document.type) {
        return document.name ?? '';
      }

      // document object returned by whatsnew does not have locale either
      // but provides title property
      if (!document.locales) {
        return document.title ?? '';
      }

      const locale = this.getLocaleSmart(document, lang);

      if (locale?.title_prefix) {
        return locale.title_prefix + ' : ' + locale.title;
      }

      return locale?.title ?? '';
    },

    getDocumentLicense(document: C2cDocument): string {
      const documentType = this.getDocumentType(document.type);
      if (['route', 'waypoint', 'area', 'book'].includes(documentType)) {
        return 'by-sa';
      }

      if (['outing', 'profile', 'xreport'].includes(documentType)) {
        return 'by-nc-nd';
      }

      if (documentType === 'article') {
        if (document.article_type === 'collab') {
          return 'by-sa';
        } else if (document.article_type === 'personal') {
          return 'by-nc-nd';
        } else {
          throw new Error(`Unexpected article_type : ${document.article_type}`);
        }
      }

      if (documentType === 'image') {
        if (document.image_type === 'collaborative') {
          return 'by-sa';
        } else if (document.image_type === 'personal') {
          return 'by-nc-nd';
        } else if (document.image_type === 'copyright') {
          return 'copyright';
        } else {
          throw new Error(`Unexpected image_type : ${document.image_type}`);
        }
      }

      throw new Error(`Unexpected document_type: ${documentType}`);
    },

    getLocaleStupid(document: C2cDocument, lang: string): Locale | null {
      if (!document.locales) {
        return null;
      }

      lang = c2c.getApiLang(lang);

      for (const result of document.locales) {
        if (result.lang === lang) {
          return result;
        }
      }

      return null;
    },

    getLocaleSmart(document: C2cDocument, lang?: string): Locale | null {
      // first of all try to search asked lang
      let result = lang ? this.getLocaleStupid(document, lang) : null;

      if (result) {
        return result;
      }

      // else, search user lang
      result = this.getLocaleStupid(document, app.config.globalProperties.$user.lang);
      if (result) {
        return result;
      }

      // else try langs by order
      for (const lang of constants.langs) {
        result = this.getLocaleStupid(document, lang);
        if (result) {
          return result;
        }
      }

      // should never happen
      return null;
    },

    hasRating(document: C2cDocument): boolean {
      return Boolean(
        document.global_rating ||
        document.rock_free_rating ||
        document.rock_required_rating ||
        document.aid_rating ||
        document.engagement_rating ||
        document.risk_rating ||
        document.equipment_rating ||
        document.exposition_rock_rating ||
        document.ice_rating ||
        document.mixed_rating ||
        document.ski_rating ||
        document.hiking_rating ||
        document.mtb_up_rating ||
        document.mtb_down_rating ||
        document.hiking_mtb_exposition ||
        document.labande_global_rating ||
        document.labande_ski_rating ||
        document.snowshoe_rating
      );
    },

    getAssociationArrayName(child: C2cDocument): string {
      const documentType = this.getDocumentType(child.type);
      return documentType === 'profile' ? 'users' : documentType + 's';
    },

    isInArray(array: C2cDocument[], document: C2cDocument): boolean {
      return array.filter((item) => item.document_id === document.document_id).length !== 0;
    },

    addAssociation(document: C2cDocument, child: C2cDocument) {
      const array = document.associations![this.getAssociationArrayName(child)];

      if (this.isInArray(array, child)) {
        return;
      }

      array.push(child);
      this.propagateProperties(document, child);
    },

    removeAssociation(document: C2cDocument, child: C2cDocument) {
      const arrayName = this.getAssociationArrayName(child);
      const array = document.associations![arrayName];

      document.associations![arrayName] = array.filter((item) => item.document_id !== child.document_id);
    },

    propagateProperties(parent: C2cDocument, child: C2cDocument) {
      // Parent is being created/modified. When a child is associated to parent,
      // it can be helpful to set parent's properties from child's properties.

      if (parent.type === 'o' && child.type === 'r') {
        this.propagateRoutePropertiesToOutingProperties(child, parent);
      } else if (
        (parent.type === 'r' && child.type === 'w') ||
        (parent.type === 'x' && child.type === 'r') ||
        (parent.type === 'x' && child.type === 'o')
      ) {
        this.propagateGeomPoint(child, parent);
      }
    },

    propagateGeomPoint(from: C2cDocument, to: C2cDocument) {
      to.geometry!.geom = to.geometry!.geom === null ? from.geometry!.geom : to.geometry!.geom;
    },

    propagateRoutePropertiesToOutingProperties(route: C2cDocument, outing: C2cDocument) {
      this.propagateGeomPoint(route, outing);

      const names = [
        'elevation_min',
        'elevation_max',

        'height_diff_down',
        'height_diff_up',

        'height_diff_difficulties',

        'global_rating',
        'engagement_rating',
        'equipment_rating',
        'rock_free_rating',

        'ice_rating',

        'labande_global_rating',
        'ski_rating',
        'snowshoe_rating',
        'hiking_rating',

        'via_ferrata_rating',

        'mtb_down_rating',
        'mtb_up_rating',
      ];

      names.forEach((name) => {
        outing[name] = outing[name] === null ? route[name] : outing[name];
      });

      // an outing being edited always has its locale
      const [locale] = outing.locales!;
      if (!locale.title) {
        locale.title = this.getDocumentTitle(route, locale.lang);
      }
    },

    buildLocale(documentType: string, lang: string): Locale {
      const def = constants.objectDefinitions[documentType];

      const result: Record<string, unknown> = {};

      for (const field of Object.values(def.fields)) {
        if (field.parent === 'locales') {
          result[field.name] = field.multiple ? [] : null;
        }
      }

      result.lang = lang;

      return result as Locale;
    },

    buildDocument(documentType: string, lang: string): C2cDocument {
      const def = constants.objectDefinitions[documentType];

      const result: C2cDocument & { associations: Record<string, C2cDocument[]> } = {
        type: def.letter,
        locales: [this.buildLocale(documentType, lang)],
        associations: {},
      };

      for (const field of Object.values(def.fields)) {
        if (field.parent === 'document') {
          result[field.name] = field.multiple ? [] : null;

          if (field.default !== undefined) {
            result[field.name] = field.default;
          }
        } else if (field.parent === 'associations') {
          result.associations[(field.documentType === 'profile' ? 'user' : field.documentType) + 's'] = [];
        }
      }

      if (def.geoLocalized) {
        result.geometry = {
          geom: null,
          geom_detail: null,
        };
      }

      return result;
    },

    getSortedAreaList(document: C2cDocument): string {
      const areas = document.areas;
      let sortedAreas: string[] = [];

      if (areas) {
        // the areas often come in different orders within 3 area objects.
        const orderedAreas: Record<string, string[]> = { range: [], admin_limits: [], country: [] };

        for (const area of areas) {
          orderedAreas[area.area_type].push(this.getLocaleSmart(area)?.title as string);
        }

        if (orderedAreas['range'].length) {
          sortedAreas = sortedAreas.concat(orderedAreas['range']);
        }

        if (orderedAreas['admin_limits'].length) {
          sortedAreas = sortedAreas.concat(orderedAreas['admin_limits']);
        }

        if (orderedAreas['country'].length) {
          sortedAreas = sortedAreas.concat(orderedAreas['country']);
        }
      }

      return sortedAreas.join(' - ');
    },

    getOutingDatesLocalized(document: C2cDocument): string {
      // date_end may be empty on outing creation
      // it will be filled on save
      // so, for the preview, we must replace an empty date_end with date start
      const date_start = document.date_start;
      const date_end = document.date_end || date_start;

      if (!date_start) {
        return app.config.globalProperties.$gettext('Invalid date');
      }

      const start = app.config.globalProperties.$dateUtils.parseDate(date_start);
      const end = app.config.globalProperties.$dateUtils.parseDate(date_end);

      if (!app.config.globalProperties.$dateUtils.isSameYear(start, end)) {
        return this.formatDate(start, 'll') + ' - ' + this.formatDate(end, 'll');
      } else if (!app.config.globalProperties.$dateUtils.isSameMonth(start, end)) {
        return this.formatDate(start, 'D MMMM') + ' - ' + this.formatDate(end, 'll');
      } else if (!app.config.globalProperties.$dateUtils.isSameDay(start, end)) {
        return this.formatDate(start, 'D') + ' - ' + this.formatDate(end, 'll');
      } else {
        return this.formatDate(end, '@1');
      }
    },

    formatDate(arg: Parameters<DateUtilsOf['toLocalizedString']>[0], formatString: string): string {
      return app.config.globalProperties.$dateUtils.toLocalizedString(arg, formatString);
    },

    // Returns true if both documents has same geolocalization point
    // it compares document.geometry.geom
    hasSameGeolocation(document1: C2cDocument, document2: C2cDocument): boolean {
      const geomIsValid = function (geom: { type?: string; coordinates?: unknown }) {
        return geom.type === 'Point' && Array.isArray(geom.coordinates) && geom.coordinates.length === 2;
      };

      const geolocation1 = document1.geometry?.geom;
      const geolocation2 = document2.geometry?.geom;

      if (geolocation1 === geolocation2) {
        // undefined === undefined
        // null === null
        // string === string
        return true;
      } else if (!geolocation1 || !geolocation2) {
        // only one of them is null or undefined or empty string
        return false;
      } else {
        // two different strings. But, it could be :
        //     '{"a":1, "b":2}' !== '{"b":2, "a":1}'
        // We must parse and test
        const data1 = JSON.parse(geolocation1);
        const data2 = JSON.parse(geolocation2);

        if (geomIsValid(data1) && geomIsValid(data2)) {
          return data1.coordinates[0] === data2.coordinates[0] && data1.coordinates[1] === data2.coordinates[1];
        } else if (!geomIsValid(data1) && !geomIsValid(data2)) {
          // both invalid structure, considere them as identical
          return true;
        } else {
          // one of thme is invalid => different
          return false;
        }
      }
    },

    getDocumentsBbox(documents: C2cDocument[]): number[] | null {
      documents = documents.filter((document) => document.geometry?.geom);

      if (documents.length === 0) {
        return null;
      }

      let minX = Infinity;
      let maxX = -Infinity;
      let minY = Infinity;
      let maxY = -Infinity;

      for (const document of documents) {
        const coordinates = JSON.parse(document.geometry!.geom as string).coordinates;
        maxX = Math.max(maxX, coordinates[0]);
        maxY = Math.max(maxY, coordinates[1]);
        minX = Math.min(minX, coordinates[0]);
        minY = Math.min(minY, coordinates[1]);
      }

      return [minX, minY, maxX, maxY].map(Math.round);
    },

    lengthWithUnit(length?: number | null): string | undefined {
      if (!length) {
        return undefined;
      }
      if (length > 1000) {
        const l = (length / 1000.0).toFixed(1);
        return `${l}&nbsp;${app.config.globalProperties.$gettext('kilometers')}`;
      }
      return `${length}&nbsp;${app.config.globalProperties.$gettext('meters')}`;
    },

    heightDiffUpWithUnit(hdu?: number | null): string | undefined {
      if (!hdu) {
        return undefined;
      }
      return `${hdu}&nbsp;${app.config.globalProperties.$gettext('meters')}`;
    },
  };

  // bound, as Vue bound the methods of the former instance: some are passed as callbacks (OutingsDownloader)
  const methods = documentUtils as unknown as Record<string, (...args: unknown[]) => unknown>;
  for (const [name, method] of Object.entries(methods)) {
    methods[name] = method.bind(documentUtils);
  }

  return documentUtils;
}

type DateUtilsOf = App['config']['globalProperties']['$dateUtils'];

export default function install(app: App) {
  app.config.globalProperties.$documentUtils = createDocumentUtils(app);
}
