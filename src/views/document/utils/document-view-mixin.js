import DocumentViewHeader from './DocumentViewHeader';
import CommentsBox from './boxes/CommentsBox';
import ImagesBox from './boxes/ImagesBox';
import MapBox from './boxes/MapBox';
import RecentOutingsBox from './boxes/RecentOutingsBox';
import RoutesBox from './boxes/RoutesBox';
import ToolBox from './boxes/ToolBox';
import ActivitiesField from './field-viewers/ActivitiesField';
import DoubleNumericField from './field-viewers/DoubleNumericField';
import EventActivityField from './field-viewers/EventActivityField';
import FieldView from './field-viewers/FieldView';
import LabelValue from './field-viewers/LabelValue';
import MarkdownSection from './field-viewers/MarkdownSection';
import ProfilesLinks from './field-viewers/ProfilesLinks';
import viewModeMixin from './view-mode-mixin';

import c2c from '@/js/apis/c2c';
import constants from '@/js/constants';
import cooker from '@/js/cooker';
import imageUrls from '@/js/image-urls';
import utils from '@/js/utils';

export default {
  components: {
    DocumentViewHeader,

    CommentsBox,
    DoubleNumericField,
    FieldView,
    LabelValue,
    ActivitiesField,
    EventActivityField,
    MapBox,
    MarkdownSection,
    ProfilesLinks,
    RecentOutingsBox,
    ToolBox,
    RoutesBox,
    ImagesBox,
  },

  mixins: [viewModeMixin],

  props: {
    draft: {
      type: Object,
      default: null,
    },
  },

  data() {
    return {
      promise: null,
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
      if (!this.document) {
        return null;
      }
      return this.documentOpenGraph();
    },
  },

  computed: {
    /*
     * properties that are deducted from URL
     */
    documentId() {
      return parseInt(this.$route.params.id, 10);
    },
    documentType() {
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
      if (!this.promise || !this.promise.data) {
        return null;
      }

      const doc = this.isVersionView ? this.promise.data.document : this.promise.data;

      return doc;
    },

    version() {
      if (!this.promise.data || !this.isVersionView) {
        return null;
      }

      return this.promise.data.version;
    },

    locale() {
      return this.document ? this.document.cooked : null;
    },

    lang() {
      return this.document ? this.document.cooked.lang : null;
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
          });
      } else if (this.isDraftView) {
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
        this.promise = c2c[this.documentType]
          .getCooked(this.documentId, this.expected_lang)
          .then(this.handleRedirection)
          .then(() => {
            this.$root.$emit('trigger-scroll');
            // notify vue-head plugin to update
            this.$emit('updateHead'); // eslint-disable-line
          })
          .then(this.scrollToHash)
          .then(this.updateUrl);
      }
    },

    handleRedirection() {
      if (this.document.redirects_to) {
        this.$router.push({ params: { id: this.document.redirects_to } });
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

      // transform any unocde into it'sd ascii value
      title = title.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

      // and clean
      title = title.toLowerCase().replace(/[^a-z0-9]+/g, '-');

      let path = `/${this.documentType}s/${this.documentId}/${this.lang}/${title}`;

      if (this.$route.hash) {
        path += this.$route.hash;
      }

      if (this.$route.path !== path) {
        this.$router.replace(path);
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
        contentUrl: imageUrls.get(this.document),
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
      if (this.document.associations?.images.length) {
        const image = this.document.associations.images[0];
        inner = {
          ...inner,
          image: [imageUrls.getBig(image)],
        };
      }
      return inner;
    },

    documentOpenGraph() {
      const title = this.$documentUtils.getDocumentTitle(this.document, this.lang);
      let meta = [
        { n: 'og:title', c: title },
        { n: 'og:type', c: this.documentType === 'article' ? 'article' : 'website' },
        { n: 'og:url', c: `https://www.camptocamp.org/${this.documentType}s/${this.documentId}` },
        { n: 'og:locale', c: this.$language.getIsoLanguageTerritory(this.lang) },
      ];
      if (this.document.associations?.images.length) {
        const image = this.document.associations.images[0];
        meta = [...meta, { n: 'og:image', c: imageUrls.getBig(image) }];
      }
      const locale = this.$documentUtils.getLocaleSmart(this.document, this.lang);
      if (locale?.summary || locale?.description) {
        meta = [
          ...meta,
          { n: 'og:description', c: utils.stripMarkdown(locale?.summary || locale?.description).substring(0, 200) },
        ];
      }
      return meta;
    },
  },
};
