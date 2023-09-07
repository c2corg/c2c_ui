import DocumentPrintLicense from './DocumentPrintLicense';
import DocumentViewHeader from './DocumentViewHeader';
import CommentsBox from './boxes/CommentsBox';
import ImagesBox from './boxes/ImagesBox';
import MapBox from './boxes/MapBox';
import RecentOutingsBox from './boxes/RecentOutingsBox';
import RoutesBox from './boxes/RoutesBox';
import SearchNavigationBox from './boxes/SearchNavigationBox';
import ToolBox from './boxes/ToolBox';
import ActivitiesField from './field-viewers/ActivitiesField';
import DoubleNumericField from './field-viewers/DoubleNumericField';
import EventActivityField from './field-viewers/EventActivityField';
import FieldView from './field-viewers/FieldView';
import LabelValue from './field-viewers/LabelValue';
import MarkdownSection from './field-viewers/MarkdownSection';
import ProfilesLinks from './field-viewers/ProfilesLinks';

import { add_search_queries } from '@/js/add-search-query';
import c2c from '@/js/apis/c2c';
import constants from '@/js/constants';
import cooker from '@/js/cooker';
import { getImageUrl } from '@/js/image-urls';
import isEditableMixin from '@/js/is-editable-mixin';
import utils from '@/js/utils';
import viewModeMixin from '@/js/view-mode-mixin';

export default {
  components: {
    DocumentViewHeader,

    CommentsBox,
    DocumentPrintLicense,
    DoubleNumericField,
    FieldView,
    LabelValue,
    ActivitiesField,
    EventActivityField,
    MapBox,
    MarkdownSection,
    ProfilesLinks,
    RecentOutingsBox,
    SearchNavigationBox,
    ToolBox,
    RoutesBox,
    ImagesBox,
  },

  mixins: [viewModeMixin, isEditableMixin],

  props: {
    draft: {
      type: Object,
      default: null,
    },
  },

  data() {
    return {
      promise: null,
      search_promise: null,
    };
  },

  head: {
    script: function () {
      if (!this.document) {
        return null;
      }
      const jsonLd = this.documentType === 'image' ? this.imageJsonLd() : this.documentJsonLd();
      return [
        {
          type: 'application/ld+json',
          id: 'json-ld',
          inner: JSON.stringify(jsonLd),
        },
      ];
    },
    meta: function () {
      const result = [
        {
          name: 'robots',
          content: 'index',
          id: 'meta-robots',
        },
      ];

      if (this.isVersionView) {
        result[0]['content'] = 'noindex';
      }

      if (!this.document) {
        return result;
      }

      return [...result, ...this.documentOpenGraph()];
    },
  },

  computed: {
    /*
     * properties that are deducted from URL
     */
    documentId() {
      if (this.isDraftView || this.isPrintingView) {
        return this.draft.document_id;
      }
      return parseInt(this.$route.params.id, 10);
    },
    documentType() {
      if (this.isPrintingView) {
        return this.$route.name.split('s-')[0];
      }
      return this.$route.name.split('-')[0];
    },
    fields() {
      return constants.objectDefinitions[this.documentType].fields;
    },
    expected_lang() {
      return this.$route.params.lang ?? this.$language.current;
    },

    /*
     * properties computed when document is loaded
     */
    document() {
      if (!this.promise?.data) {
        return undefined;
      }

      const doc = this.isVersionView ? this.promise.data.document : this.promise.data;

      return doc;
    },

    /*
     * properties computed when search results is loaded
     */
    search() {
      if (!this.search_promise?.data) {
        return false;
      }

      const documents = this.isVersionView ? undefined : this.search_promise.data;

      add_search_queries(this.$route.query, documents.documents);

      return documents;
    },

    index() {
      if (!this.search) {
        return undefined;
      }
      if (!this.search.documents) {
        return undefined;
      }
      return this.search.documents.findIndex((d) => d.document_id === this.documentId);
    },

    previousDocument() {
      if (!this.search) {
        return undefined;
      }
      if (!this.search.documents) {
        return undefined;
      }
      if (typeof this.index === 'undefined') {
        return undefined;
      }
      return this.search.documents[this.index - 1];
    },

    nextDocument() {
      if (!this.search) {
        return undefined;
      }
      if (!this.search.documents) {
        return undefined;
      }
      if (typeof this.index === 'undefined') {
        return undefined;
      }
      return this.search.documents[this.index + 1];
    },

    version() {
      if (!this.promise.data || !this.isVersionView) {
        return undefined;
      }

      return this.promise.data.version;
    },

    locale() {
      return this.document?.cooked;
    },

    lang() {
      return this.document?.cooked?.lang;
    },
  },

  watch: {
    $route: {
      handler: 'loadDocument',
      immediate: true,
    },
  },

  methods: {
    loadDocument($route) {
      if (this.isVersionView) {
        this.$imageViewer.clear();
        this.promise = c2c[this.documentType]
          .getVersion(this.documentId, this.$route.params.lang, this.$route.params.version)
          .then((response) => {
            // version object with all data
            response.data.version.next_version_id = response.data.next_version_id;
            response.data.version.previous_version_id = response.data.previous_version_id;

            // (document may be masked and unavailable)
            if (response.data.document) {
              // versioned data are poor...
              response.data.document.areas = [];
              response.data.document.creator = null;
              response.data.document.associations = {
                articles: [],
                books: [],
                images: [],
                users: [],
                waypoints: [],
                waypoint_children: [],
                all_routes: {
                  documents: [],
                },
                recent_outings: {
                  documents: [],
                },
              };
            }
            this.$emit('updateHead');
          });
      } else if (this.isDraftView || this.isPrintingView) {
        this.promise = {};

        this.$imageViewer.clear();
        cooker.cook(this.draft.locales[0]).then((response) => {
          this.draft.cooked = response.data;
          this.$set(this.promise, 'data', this.draft);
        });
      } else {
        // normal mode
        // because of updateUrl(), we may have nothing to do
        if (
          this.document &&
          parseInt($route.params.id, 10) === this.document.document_id &&
          this.expected_lang === this.lang
        ) {
          return;
        }

        this.$imageViewer.clear();

        if (typeof this.$route.query.offset !== 'undefined') {
          this.search_promise = c2c[this.documentType].getAll(this.$route.query);
        } else {
          this.search_promise = new Promise(() => []);
        }

        this.promise = c2c[this.documentType]
          .getCooked(this.documentId, this.expected_lang)
          .then(this.handleRedirection)
          .then(() => {
            this.$root.$emit('trigger-scroll');
            // notify vue-head plugin to update
            this.$emit('updateHead');
          })
          .then(this.scrollToHash)
          .then(this.updateUrl);
      }
    },

    handleRedirection() {
      if (this.document.redirects_to) {
        this.$router.push({ params: { id: this.document.redirects_to, query: this.$route.query } });
      }
    },

    scrollToHash() {
      if (this.$route.hash) {
        // we'll have to wait for DOM update
        this.$nextTick(() => {
          const el = document.querySelector(this.$route.hash);

          if (el) {
            const docEl = document.documentElement;
            const docRect = docEl.getBoundingClientRect();
            const elRect = el.getBoundingClientRect();
            const y = elRect.top - docRect.top;
            window.scrollTo(0, y - 50); // navbar height ...
          } else {
            window.scrollTo(0, 0); // if anchor is not found, go to top
          }
        });
      }
    },

    updateUrl() {
      let title = this.$documentUtils.getDocumentTitle(this.document, this.lang);

      // transform any unicode into its ascii value
      title = title.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

      // and clean
      title = title.toLowerCase().replace(/[^a-z0-9]+/g, '-');

      let path = `/${this.documentType}s/${this.documentId}/${this.lang}/${title}`;

      if (this.$route.hash) {
        path += this.$route.hash;
      }

      if (this.$route.path !== path) {
        this.$router.replace({ path: path, query: this.$route.query });
      }
    },

    imageJsonLd() {
      let license;
      switch (this.document.image_type) {
        case 'collaborative':
          license = 'http://creativecommons.org/licenses/by-sa/3.0/fr/';
          break;
        case 'personal':
          license = 'http://creativecommons.org/licenses/by-nc-nd/3.0/fr/';
          break;
        case 'copyright':
        default:
          license = 'https://www.camptocamp.org/articles/106728';
          break;
      }
      return {
        '@context': 'https://schema.org',
        '@type': 'ImageObject',
        contentUrl: getImageUrl(this.document),
        license,
        acquireLicensePage: 'https://www.camptocamp.org/articles/106728',
      };
    },

    documentJsonLd() {
      const headline = this.$documentUtils.getDocumentTitle(this.document, this.lang);
      let inner = {
        '@context': 'https://schema.org',
        '@type': 'NewsArticle',
        headline,
      };
      if (this.document.associations?.images?.length) {
        const image = this.document.associations.images[0];
        inner = {
          ...inner,
          image: [getImageUrl(image, 'BI')],
        };
      }
      return inner;
    },

    documentOpenGraph() {
      const title = this.$documentUtils.getDocumentTitle(this.document, this.lang);
      let meta = [
        { p: 'og:title', c: title, id: 'meta-og-title' },
        { p: 'og:type', c: this.documentType === 'article' ? 'article' : 'website', id: 'meta-og-type' },
        { p: 'og:url', c: `https://www.camptocamp.org/${this.documentType}s/${this.documentId}`, id: 'meta-og-url' },
        { p: 'og:locale', c: this.$language.getIsoLanguageTerritory(this.lang), id: 'meta-og-locale' },
      ];
      const locale = this.$documentUtils.getLocaleSmart(this.document, this.lang);
      if (locale?.summary || locale?.description) {
        const description = utils.stripMarkdown(locale?.summary || locale?.description).substring(0, 200);
        meta = [
          ...meta,
          { p: 'og:description', c: description, id: 'meta-og-description' },
          { n: 'description', c: description, id: 'meta-description' },
        ];
      }
      if (this.document.associations?.images?.length) {
        const image = this.document.associations.images[0];
        meta = [...meta, { p: 'og:image', c: getImageUrl(image, 'BI'), id: 'meta-og-image' }];
      }
      return meta;
    },
  },
};
