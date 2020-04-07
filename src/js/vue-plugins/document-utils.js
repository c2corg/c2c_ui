/*
 * This module manipulate document objects
 * it does not provide any API service
 */

import constants from '@/js/constants';

// we need to use a VM, because we need access to Vue.$user.lang

export default function install(Vue) {
  Vue.prototype.$documentUtils = new Vue({
    methods: {
      getCreationTitle(documentType) {
        if (documentType === 'outing') return this.$gettext('add an outing');
        if (documentType === 'route') return this.$gettext('add a route');
        if (documentType === 'image') return this.$gettext('add an image');
        if (documentType === 'waypoint') return this.$gettext('add a waypoint');
        if (documentType === 'map') return this.$gettext('add a map');
        if (documentType === 'xreport') return this.$gettext('add an incident/accident report');
        if (documentType === 'area') return this.$gettext('add an area');
        if (documentType === 'book') return this.$gettext('add a book');
        if (documentType === 'article') return this.$gettext('add an article');

        throw new Error(`Unexpected type : ${this.documentType}`);
      },

      getDocumentType(letterType) {
        return constants.letterToDocumentType[letterType];
      },

      getDocumentTitle(document, lang) {
        // profile does not have locale, get profile's name
        if (document.type === 'u' || !document.type) {
          return document.name || '';
        }

        // document object returned by whatsnew does not have locale either
        // but provides title property
        if (!document.locales) {
          return document.title || '';
        }

        const locale = this.$documentUtils.getLocaleSmart(document, lang);

        if (locale.title_prefix) {
          return locale.title_prefix + ' : ' + locale.title;
        }

        return locale.title || '';
      },

      getLocaleStupid(document, lang) {
        if (!document.locales) {
          return null;
        }

        for (const result of document.locales) {
          if (result.lang === lang) {
            return result;
          }
        }

        return null;
      },

      getLocaleSmart(document, lang) {
        // first of all try to search asked lang
        let result = lang ? this.$documentUtils.getLocaleStupid(document, lang) : null;

        if (result) {
          return result;
        }

        // else, search user lang
        result = this.$documentUtils.getLocaleStupid(document, this.$user.lang);
        if (result) {
          return result;
        }

        // else try langs by order
        for (const lang of constants.langs) {
          result = this.$documentUtils.getLocaleStupid(document, lang);
          if (result) {
            return result;
          }
        }

        // should never happen
        return null;
      },

      hasRating(document) {
        return document.global_rating ||
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
          document.labande_ski_rating;
      },

      getAssociationArrayName(child) {
        const documentType = this.getDocumentType(child.type);
        return documentType === 'profile' ? 'users' : documentType + 's';
      },

      isInArray(array, document) {
        return array.filter(item => item.document_id === document.document_id).length !== 0;
      },

      addAssociation(document, child) {
        const array = document.associations[this.getAssociationArrayName(child)];

        if (this.isInArray(array, child)) {
          return;
        }

        array.push(child);
        this.propagateAssociationProperties(document, child);
      },

      removeAssociation(document, child) {
        const arrayName = this.getAssociationArrayName(child);
        const array = document.associations[arrayName];

        document.associations[arrayName] = array.filter(item => item.document_id !== child.document_id);
      },

      propagateAssociationProperties(parent, child) {
        // propagate route property to outing
        if (parent.type !== 'o' || child.type !== 'r') {
          return;
        }

        const route = child;
        const outing = parent;

        outing.geometry.geom = outing.geometry.geom === null ? route.geometry.geom : outing.geometry.geom;

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
          'mtb_up_rating'
        ];

        names.forEach((name) => {
          outing[name] = outing[name] === null ? route[name] : outing[name];
        });

        if (!outing.locales[0].title) {
          outing.locales[0].title = this.getDocumentTitle(route, outing.locales[0].lang);
        }
      },

      buildLocale(documentType, lang) {
        const def = constants.objectDefinitions[documentType];

        const result = {};

        for (const field of Object.values(def.fields)) {
          if (field.parent === 'locales') {
            result[field.name] = field.multiple ? [] : null;
          }
        }

        result.lang = lang === 'zh_CN' ? 'en' : lang;

        return result;
      },

      buildDocument(documentType, lang) {
        const def = constants.objectDefinitions[documentType];

        const result = {
          type: def.letter,
          locales: [
            this.buildLocale(documentType, lang)
          ],
          associations: {}
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
            geom_detail: null
          };
        }

        return result;
      },

      getSortedAreaList(document) {
        const areas = document.areas;
        let sortedAreas = [];

        if (areas) {
          // the areas often come in different orders within 3 area objects.
          const orderedAreas = { 'range': [], 'admin_limits': [], 'country': [] };

          for (const area of areas) {
            orderedAreas[area.area_type].push(this.getLocaleSmart(area).title);
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

      getOutingDatesLocalized(document) {
        // date_end may be empty on outing creation
        // it will be filled on save
        // so, for the preview, we must replace an empty date_end with date start
        const date_start = document.date_start;
        const date_end = document.date_end || date_start;

        if (!date_start) {
          return this.$gettext('Invalid date');
        }

        const start = this.$moment.parseDate(date_start).locale(this.$language.current);
        const end = this.$moment.parseDate(date_end).locale(this.$language.current);
        const sameYear = start.year() === end.year();
        const sameMonth = start.month() === end.month();
        const sameDay = start.date() === end.date();

        if (!sameYear) {
          return start.format('Do MMMM YYYY') + ' - ' + end.format('Do MMMM YYYY');
        } else if (!sameMonth) {
          return start.format('Do MMMM') + ' - ' + end.format('Do MMMM YYYY');
        } else if (!sameDay) {
          return start.format('Do') + ' - ' + end.format('Do MMMM YYYY');
        } else {
          return end.format('dddd Do MMMM YYYY');
        }
      },

      // Returns true if both documents has same geolocalization point
      // it compares document.geometry.geom
      hasSameGeolocation(document1, document2) {
        const geomIsValid = function(geom) {
          return geom.type === 'Point' && Array.isArray(geom.coordinates) && geom.coordinates.length === 2;
        };

        const geolocation1 = (document1.geometry || {}).geom;
        const geolocation2 = (document2.geometry || {}).geom;

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
            return (data1.coordinates[0] === data2.coordinates[0] && data1.coordinates[1] === data2.coordinates[1]);
          } else if (!geomIsValid(data1) && !geomIsValid(data2)) {
            // both invalid structure, considere them as identical
            return true;
          } else {
            // one of thme is invalid => different
            return false;
          }
        }
      }
    }
  });
}
