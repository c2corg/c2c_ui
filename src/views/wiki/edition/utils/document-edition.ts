// What the edition views (RouteEditionView, WaypointEditionView...) share: the document to edit, loaded from the route
// (or built for a new one), its fields and their errors, and its saving.
//
//   const { document, fields, ... } = useDocumentEdition({ beforeSave });
//
// A view may give afterLoad(), beforeSave() and afterSave() hooks: they are called when the document is loaded,
// before it's checked and saved, and once its saving has started.
import { toast } from 'bulma-toast';
import {
  computed,
  getCurrentInstance,
  nextTick,
  onBeforeMount,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
  type Ref,
} from 'vue';
import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router';

import c2c from '@/js/apis/c2c';
import type DocumentService from '@/js/apis/c2c/DocumentService';
import { apiErrors } from '@/js/apis/c2c/api-errors';
import type { ApiError } from '@/js/apis/c2c/schemas';
import { useNoRobots } from '@/js/composables/head';
import constants from '@/js/constants';
import type Field from '@/js/constants/Field';
import type { C2cDocument } from '@/js/vue-plugins/document-utils';

export type EditionHooks = {
  afterLoad?: () => void;
  beforeSave?: () => void;
  afterSave?: () => void;
};

// the document being loaded: data is null until the document and its associations given in the url are loaded
type Loading = { data?: C2cDocument | null; loading?: boolean | number };

/** Whether to leave a form: with unsaved changes, the user is asked first */
export function confirmLeave(modified: boolean, gettext: (text: string) => string): boolean {
  return !modified || window.confirm(gettext('Do you really want to leave? you have unsaved changes!'));
}

export function useDocumentEdition(hooks: EditionHooks = {}) {
  const globals = getCurrentInstance()!.appContext.config.globalProperties;
  const route = useRoute();
  const router = useRouter();

  useNoRobots();

  const promise = ref<Loading>({});
  const fields = ref<Record<string, Field>>({});
  const saving = ref(false);
  const modified = ref(false);

  // right part of route name : add or edit
  const mode = computed(() => String(route.name).split('-')[1]);
  const documentType = computed(() => String(route.name).replace(/-(edit|add)/, ''));
  const documentId = computed(() => String(route.params.id));
  const lang = computed(() => String(route.params.lang));
  // null while it loads
  const document = computed(() => promise.value.data ?? undefined);
  // in edit mode, there is only one locale
  const editedLocale = computed(() => (document.value ? document.value.locales![0] : null));

  const service = (type: string) => c2c[type] as DocumentService;

  function cleanErrors() {
    for (const field of Object.values(fields.value)) {
      field.error = null;
    }
  }

  function load() {
    fields.value = constants.objectDefinitions[documentType.value].fields;
    cleanErrors();

    // as this method will be called in any case,
    // we must check that the user is logged
    // redirection is made be beforeRouteEnter()
    // but we do not want to do anything in this case
    if (!globals.$user.isLogged) {
      return;
    }

    if (mode.value === 'edit') {
      promise.value = service(documentType.value)
        .get(documentId.value, lang.value)
        .then((response) => {
          const locales = response.data.locales!;

          if (!locales.length) {
            // it's a translation from an existing doc
            locales.push(globals.$documentUtils.buildLocale(documentType.value, lang.value));
          }

          hooks.afterLoad?.();

          // TODO : implement an algorithm to determine if document has been modified
          modified.value = true;
        });
    } else {
      const newDocument = globals.$documentUtils.buildDocument(documentType.value, lang.value);
      const loading = { data: null as C2cDocument | null, loading: 1 };
      promise.value = loading;
      // changed through the ref, so that the view follows them
      const state = promise.value as typeof loading;

      // as some doc may be loaded, give the document once it's totally ready
      const onload = () => {
        state.loading -= 1;
        if (state.loading === 0) {
          // TODO : implements a algorithm to determine if document has been modified
          modified.value = true;
          state.data = newDocument;
          hooks.afterLoad?.();
        }
      };

      // add current user for outings
      if (documentType.value === 'outing') {
        state.loading += 1;
        service('profile')
          .get(globals.$user.id!)
          .then((response) => {
            globals.$documentUtils.addAssociation(newDocument, response.data);
            onload();
          });
      }

      // Add associations presents in url query
      for (const letter of Object.keys(route.query)) {
        const type = globals.$documentUtils.getDocumentType(letter);

        if (type && route.query[letter]) {
          // Value may be a number or a string
          const ids = String(route.query[letter]).split(',');

          for (const id of ids) {
            state.loading += 1;
            service(type)
              .get(id)
              .then((response) => {
                globals.$documentUtils.addAssociation(newDocument, response.data);
                onload();
              });
          }
        }
      }

      if (route.query.act) {
        newDocument.activities = String(route.query.act).split(',');
      }

      onload();
    }
  }

  // display a popup with info from fields that contains an error
  // return true if popup is displayed, false otherwise
  function displayErrors(isApiMessage: boolean) {
    const fieldsWithError = Object.values(fields.value).filter((field) => field.error !== null);
    const i18nContext = isApiMessage ? 'API message' : undefined;

    // list of possible API message (keep js syntax, for messages extraction)
    // $gettext('Shorter than minimum length 1', 'API message');
    // $gettext('at least one route required', 'API message');
    // $gettext('at least one user required', 'API message');
    // $gettext('This field must be a valid ISBN.', 'API message');

    if (fieldsWithError.length !== 0) {
      const messages = fieldsWithError.map(
        (field) =>
          `${globals.$gettext(field.name)} : ${globals.$gettext((field.error as ApiError).description, i18nContext)}`
      );

      toast({ message: `<ul><li>${messages.join('</li><li>')}</li></ul>`, type: 'is-danger', position: 'center' });

      return true;
    }

    return false;
  }

  function dispatchError(fieldName: string, error: ApiError) {
    if (fields.value[fieldName] === undefined) {
      // $gettext('Conflict: version of locale \'en\' has changed')
      // $gettext('Conflict: version of locale \'es\' has changed')
      // $gettext('Conflict: version of locale \'eu\' has changed')
      // $gettext('Conflict: version of locale \'de\' has changed')
      // $gettext('Conflict: version of locale \'it\' has changed')
      // $gettext('Conflict: version of locale \'ca\' has changed')
      // $gettext('Conflict: version of locale \'fr\' has changed')
      // $gettext('Conflict: version of locale \'sl\' has changed')
      // $gettext('Conflict: version of locale \'zh_CN\' has changed')
      // $gettext('Conflict: version of document has changed')
      toast({
        // an error without name: the request had no answer of the API
        message: error.name
          ? globals.$gettext(`${error.name}: ${error.description}`)
          : globals.$gettext(error.description, 'API message'),
        type: 'is-danger',
        position: 'center',
      });
    } else {
      fields.value[fieldName].error = error;
    }
  }

  function dispatchErrors(errors: ApiError[]) {
    cleanErrors();

    for (const error of errors) {
      const path = error.name.split('.');

      if (path[0] === 'locales') {
        dispatchError(path[2], error);
      } else if (path[0] === 'associations') {
        dispatchError(path[1], error);
      } else {
        dispatchError(path[0], error);
      }
    }

    displayErrors(true);
  }

  // after saving, go to document
  // when it's a creation, id is in request's response.
  function goToDocument(id: number) {
    router.push({
      name: documentType.value,
      params: {
        id,
        lang: lang.value,
      },
    });
  }

  function save(comment: string) {
    if (lang.value === 'eu' && !globals.$user.isModerator) {
      toast({
        message: globals.$gettext(
          "Sorry, euskara lang has been frozen.\nWe're looking for a moderator, if you're interested, please contact board@camptocamp.org"
        ),
        type: 'is-danger',
        position: 'center',
      });
      return;
    }

    hooks.beforeSave?.(); // allow each view to handle some specific cases

    const doc = document.value!;
    for (const field of Object.values(fields.value)) {
      field.error = field.getError(doc, editedLocale.value!);
    }

    if (displayErrors(false)) {
      return;
    }

    let request;

    saving.value = true;

    if (mode.value === 'edit') {
      request = service(documentType.value)
        .save(doc as { document_id: number }, comment)
        .then(() => {
          modified.value = false;
          goToDocument(doc.document_id!);
        });
    } else {
      request = service(documentType.value)
        .create(doc)
        .then((response) => {
          modified.value = false;
          goToDocument(response.data.document_id);
        });
    }

    hooks.afterSave?.(); // allow each view to handle some specific cases

    request.catch((error) => {
      saving.value = false;
      dispatchErrors(apiErrors(error));
    });
  }

  function beforeUnload(event: BeforeUnloadEvent) {
    if (modified.value) {
      event.preventDefault();
      event.returnValue = '';
    }
  }

  // loaded before the first render, as the $route watcher of the mixin did
  onBeforeMount(load);
  watch(() => route.fullPath, load);

  onMounted(() => window.addEventListener('beforeunload', beforeUnload));
  onBeforeUnmount(() => window.removeEventListener('beforeunload', beforeUnload));

  // returning false cancels the navigation (vue-router 5 deprecates the next() callback)
  onBeforeRouteLeave(() => {
    if (!confirmLeave(modified.value, globals.$gettext)) {
      return false;
    }
  });

  return {
    promise,
    fields,
    saving,
    modified,
    mode,
    documentType,
    documentId,
    lang,
    document,
    editedLocale,
    save,
  };
}

/**
 * Once the document gets its first point (clicked on the map, typed, or given by an association), the map fits it.
 * geom_detail too for the views editing a track.
 */
export function useFitMapOnFirstGeometry(
  document: Ref<C2cDocument | null | undefined>,
  map: Ref<{ fitMapToDocuments(): unknown } | null>,
  { withTrack = false } = {}
) {
  const onGeometry = (to: unknown, from: unknown) => {
    if (from === null && to) {
      nextTick(() => {
        map.value!.fitMapToDocuments();
      });
    }
  };

  watch(() => document.value?.geometry?.geom, onGeometry);
  if (withTrack) {
    watch(() => document.value?.geometry?.geom_detail, onGeometry);
  }
}
