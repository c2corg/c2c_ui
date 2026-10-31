// What the document views (RouteView, WaypointView...) share: the document, loaded from the route, or given as a draft
// (preview of the edition, printing), its view mode, whether the user can edit it, and the <head> tags of its page.
//
//   const props = defineProps(documentViewProps);
//   const { document, fields, ... } = useDocumentView(props);
import { computed, getCurrentInstance, nextTick, ref, watch, type PropType } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import c2c from '@/js/apis/c2c';
import type DocumentService from '@/js/apis/c2c/DocumentService';
import { isDeletable, isEditable } from '@/js/composables/editable';
import { useHead, type HeadTag } from '@/js/composables/head';
import { useViewMode } from '@/js/composables/view-mode';
import constants from '@/js/constants';
import cooker from '@/js/cooker';
import bus from '@/js/event-bus';
import { getImageUrl, type Image } from '@/js/image-urls';
import utils from '@/js/utils';
import type { C2cDocument } from '@/js/vue-plugins/document-utils';

export const documentViewProps = {
  // the document of the edition preview, or of the printing view
  draft: {
    type: Object as PropType<C2cDocument | null>,
    default: null,
  },
};

// what the views read of the API response: the document, or for a version, the document and the version
type Loaded = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data?: any;
};

// the locale of a document type, as ?cook=<lang> gives it
// (a private profile has none)
type CookedLocale<D extends C2cDocument> = NonNullable<Extract<D, { cooked?: unknown }>['cooked']>;

// D: the document type of the view (Route, Waypoint...), as its schema gives it (src/js/apis/c2c/schemas.ts)
export function useDocumentView<D extends C2cDocument = C2cDocument>(props: { draft: C2cDocument | null }) {
  const globals = getCurrentInstance()!.appContext.config.globalProperties;
  const route = useRoute();
  const router = useRouter();
  const viewMode = useViewMode();
  const { isVersionView, isDraftView, isPrintingView, isNormalView } = viewMode;

  const promise = ref<Loaded | null>(null);

  /*
   * properties that are deducted from URL
   */
  const documentId = computed<number>(() => {
    if (isDraftView.value || isPrintingView.value) {
      return props.draft!.document_id!;
    }
    return parseInt(String(route.params.id), 10);
  });

  const documentType = computed<string>(() => {
    const name = String(route.name);
    return isPrintingView.value ? name.split('s-')[0] : name.split('-')[0];
  });

  const fields = computed(() => constants.objectDefinitions[documentType.value].fields);

  const expectedLang = computed(() => String(route.params.lang ?? globals.$language.current));

  /*
   * properties computed when document is loaded
   */
  // a merged document only gives the one it was merged into
  const document = computed<(D & { redirects_to?: number }) | undefined>(() => {
    if (!promise.value?.data) {
      return undefined;
    }
    return isVersionView.value ? promise.value.data.document : promise.value.data;
  });

  const version = computed(() => {
    if (!promise.value?.data || !isVersionView.value) {
      return undefined;
    }
    return promise.value.data.version;
  });

  const locale = computed(() => document.value?.cooked as CookedLocale<D> | undefined);

  // (the locale type of D is only known in the views)
  const lang = computed<string>(
    () => (locale.value as { lang?: string } | undefined)?.lang ?? globals.$language.current!
  );

  const editable = computed(() =>
    document.value ? isEditable(document.value, documentType.value, globals.$user, isNormalView.value) : false
  );

  const deletable = computed(() =>
    document.value ? isDeletable(document.value, documentType.value, globals.$user, isNormalView.value) : false
  );

  const service = () => c2c[documentType.value] as DocumentService;

  function getCurrentPath() {
    let title = document.value ? globals.$documentUtils.getDocumentTitle(document.value, lang.value) : '';

    // transform any unicode into its ascii value
    title = title.normalize('NFD').replace(/[̀-ͯ]/g, '');

    // and clean
    title = title.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    let path = `/${documentType.value}s/${documentId.value}/${lang.value}/${title}`;

    if (route.hash) {
      path += route.hash;
    }

    return path;
  }

  function handleRedirection() {
    if (document.value?.redirects_to) {
      router.push({ params: { id: document.value.redirects_to } });
    }
  }

  function scrollToHash() {
    if (route.hash) {
      // we'll have to wait for DOM update
      nextTick(() => {
        const el = window.document.querySelector(route.hash);

        if (el) {
          const docEl = window.document.documentElement;
          const docRect = docEl.getBoundingClientRect();
          const elRect = el.getBoundingClientRect();
          const y = elRect.top - docRect.top;
          window.scrollTo(0, y - 50); // navbar height ...
        } else {
          window.scrollTo(0, 0); // if anchor is not found, go to top
        }
      });
    }
  }

  function updateUrl() {
    if (!document.value) {
      return;
    }

    const currentPath = getCurrentPath();
    if (route.path !== currentPath) {
      router.replace(currentPath);
    }
  }

  function loadDocument() {
    const draft = props.draft!;

    if (isVersionView.value) {
      globals.$imageViewer.clear();
      promise.value = service()
        .getVersion(documentId.value, String(route.params.lang), String(route.params.version))
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
        });
    } else if (isPrintingView.value && draft.cooked) {
      // the printing view loads documents with ?cook=, so they are already cooked
      globals.$imageViewer.clear();
      promise.value = { data: draft };
    } else if (isDraftView.value || isPrintingView.value) {
      promise.value = {};

      globals.$imageViewer.clear();
      cooker.cook(draft.locales![0]).then((response) => {
        draft.cooked = response.data;
        promise.value = { data: draft };
      });
    } else {
      // normal mode
      // because of updateUrl(), we may have nothing to do
      if (
        document.value &&
        parseInt(String(route.params.id), 10) === document.value.document_id &&
        expectedLang.value === lang.value
      ) {
        return;
      }

      globals.$imageViewer.clear();
      promise.value = service()
        .getCooked(documentId.value, expectedLang.value)
        .then(handleRedirection)
        .then(() => {
          bus.emit('trigger-scroll');
        })
        .then(scrollToHash)
        .then(updateUrl);
    }
  }

  // any navigation: another document, language, version, or the same one with another hash
  watch(() => route.fullPath, loadDocument, { immediate: true });

  /*
   * <head> tags, updated when the document is loaded
   */
  function imageJsonLd(image: C2cDocument) {
    let license;
    switch (image.image_type) {
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
      contentUrl: getImageUrl(image as Image),
      license,
      acquireLicensePage: 'https://www.camptocamp.org/articles/106728',
    };
  }

  function documentJsonLd(doc: C2cDocument) {
    const headline = globals.$documentUtils.getDocumentTitle(doc, lang.value);
    let inner: Record<string, unknown> = {
      '@context': 'https://schema.org',
      '@type': 'NewsArticle',
      headline,
    };
    if (doc.associations?.images?.length) {
      const image = doc.associations.images[0];
      inner = {
        ...inner,
        image: [getImageUrl(image as Image, 'BI')],
      };
    }
    return inner;
  }

  function documentOpenGraph(doc: C2cDocument) {
    const title = globals.$documentUtils.getDocumentTitle(doc, lang.value);
    let meta: HeadTag[] = [
      { p: 'og:title', c: title, id: 'meta-og-title' },
      { p: 'og:type', c: documentType.value === 'article' ? 'article' : 'website', id: 'meta-og-type' },
      { p: 'og:url', c: `https://www.camptocamp.org/${documentType.value}s/${documentId.value}`, id: 'meta-og-url' },
      { p: 'og:locale', c: globals.$language.getIsoLanguageTerritory(lang.value), id: 'meta-og-locale' },
    ];
    const docLocale = globals.$documentUtils.getLocaleSmart(doc, lang.value);
    const text = (docLocale?.summary || docLocale?.description) as string | undefined;
    if (text) {
      const description = utils.stripMarkdown(text).substring(0, 200);
      meta = [
        ...meta,
        { p: 'og:description', c: description, id: 'meta-og-description' },
        { n: 'description', c: description, id: 'meta-description' },
      ];
    }
    if (doc.associations?.images?.length) {
      const image = doc.associations.images[0];
      meta = [...meta, { p: 'og:image', c: getImageUrl(image as Image, 'BI'), id: 'meta-og-image' }];
    }
    return meta;
  }

  useHead(() => {
    const doc = document.value;
    const robots = { name: 'robots', content: isVersionView.value ? 'noindex' : 'index', id: 'meta-robots' };
    return {
      script: doc
        ? [
            {
              type: 'application/ld+json',
              id: 'json-ld',
              inner: JSON.stringify(documentType.value === 'image' ? imageJsonLd(doc) : documentJsonLd(doc)),
            },
          ]
        : null,
      meta: doc ? [robots, ...documentOpenGraph(doc)] : [robots],
      link: [{ rel: 'canonical', href: `https://www.camptocamp.org${getCurrentPath()}`, id: 'canonical' }],
    };
  });

  return {
    ...viewMode,
    promise,
    documentId,
    documentType,
    fields,
    document,
    version,
    locale,
    lang,
    isEditable: editable,
    isDeletable: deletable,
  };
}
