// What the edition views (RouteEditionView, WaypointEditionView...) share: the document to edit, loaded from the route
// (or built for a new one), its fields and their errors, and its saving.
//
//   const { document, fields, ... } = useDocumentEdition({ beforeSave });
//
// A view may give afterLoad(), beforeSave() and afterSave() hooks: they are called when the document is loaded,
// before it's checked and saved, and once its saving has started; afterSaved() once an edited document is saved.
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
import { apiErrors, errorText, type ShownApiError } from '@/js/apis/c2c/api-errors';
import { useNoRobots } from '@/js/composables/head';
import constants from '@/js/constants';
import type Field from '@/js/constants/Field';
import { toast } from '@/js/toast';
import type { C2cDocument } from '@/js/vue-plugins/document-utils';
import { useOfflineStore } from '@/stores/offline';
import { useOutingQueueStore } from '@/stores/outing-queue';

export type EditionHooks = {
  afterLoad?: () => void;
  beforeSave?: () => void;
  afterSave?: () => void;
  // once an edited document is saved, before leaving the form: its failures do not stop it
  afterSaved?: (document: C2cDocument) => unknown;
};

// the document being loaded: data is null until the document and its associations given in the url are loaded
type Loading = { data?: C2cDocument | null; loading?: boolean | number };

/** Whether to leave a form: with unsaved changes, the user is asked first */
// the translation function is named $gettext: tools/extract-messages.ts only finds the messages of $gettext() calls
export function confirmLeave(modified: boolean, $gettext: (text: string) => string): boolean {
  return !modified || window.confirm($gettext('Do you really want to leave? you have unsaved changes!'));
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
  // an outing waiting on the phone (src/stores/outing-queue.ts), edited again: ?draft=<its id>
  const draftId = ref<string | null>(null);
  // who writes, read when the form opens: a session refused while saving signs the user out (user.id null) before the
  // outing is kept on the phone, which must still be theirs
  let author: number | null = null;
  const offline = useOfflineStore();
  // only when an outing needs it: the other forms never do
  const queue = () => useOutingQueueStore();

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
    author = globals.$user.id;

    draftId.value = null;
    if (documentType.value === 'outing' && route.query.draft) {
      void loadDraft(String(route.query.draft));
    } else if (mode.value === 'edit') {
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

      // add current user for outings. Without a network (an outing written in the mountains), the user as known on
      // the phone: the form must open anyway
      if (documentType.value === 'outing') {
        state.loading += 1;
        service('profile')
          .get(globals.$user.id!)
          .then((response) => {
            globals.$documentUtils.addAssociation(newDocument, response.data);
            onload();
          })
          .catch(() => {
            const me = { type: 'u', document_id: globals.$user.id!, name: globals.$user.name ?? '' } as C2cDocument;
            globals.$documentUtils.addAssociation(newDocument, me);
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
              })
              .catch(() => {
                // without a network, the copy of Favourites if it was saved offline
                const saved = offline.find(type, Number(id))?.data;
                if (saved) {
                  globals.$documentUtils.addAssociation(newDocument, saved);
                }
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

  async function loadDraft(id: string) {
    promise.value = { data: null, loading: 1 };
    const item = await queue()
      .get(id)
      .catch(() => null);
    if (String(route.query.draft) !== id) {
      return;
    }
    if (!item) {
      toast({
        message: globals.$gettext('This outing is no longer waiting: it was published or removed meanwhile.'),
        type: 'is-warning',
        position: 'center',
      });
      router.replace({ name: 'offline' });
      return;
    }
    draftId.value = id;
    promise.value = {
      data: Object.assign(globals.$documentUtils.buildDocument(documentType.value, lang.value), item.payload),
    };
    modified.value = true;
    hooks.afterLoad?.();
  }

  // display a popup with info from fields that contains an error
  // return true if popup is displayed, false otherwise
  function displayErrors() {
    const fieldsWithError = Object.values(fields.value).filter((field) => field.error !== null);

    // list of possible API message (keep js syntax, for messages extraction)
    // $gettext('at least one route required', 'API message');
    // $gettext('at least one user required', 'API message');
    // $gettext('This field must be a valid ISBN.', 'API message');

    if (fieldsWithError.length !== 0) {
      const messages = fieldsWithError.map(
        (field) =>
          `${globals.$gettext(field.name)} : ${errorText(field.error!, globals.$gettext, field.error!.context)}`
      );

      const list = window.document.createElement('ul');
      list.append(
        ...messages.map((message) => {
          const item = window.document.createElement('li');
          item.textContent = message;
          return item;
        })
      );
      toast({ message: list, type: 'is-danger', position: 'center' });

      return true;
    }

    return false;
  }

  function dispatchError(fieldName: string, error: ShownApiError) {
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
        // an error without name: the request had no answer of the API; with a limit: its text is translated alone
        message: !error.name
          ? errorText(error, globals.$gettext, 'API message')
          : error.limit === undefined
            ? globals.$gettext(`${error.name}: ${error.description}`)
            : `${error.name}: ${errorText(error, globals.$gettext, 'API message')}`,
        type: 'is-danger',
        position: 'center',
      });
    } else {
      fields.value[fieldName].error = { ...error, context: 'API message' };
    }
  }

  function dispatchErrors(errors: ShownApiError[]) {
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

    displayErrors();
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

  // the checks of the fields, as before saving: false (and the errors shown) when one fails
  function isValid() {
    hooks.beforeSave?.(); // allow each view to handle some specific cases

    const doc = document.value!;
    for (const field of Object.values(fields.value)) {
      field.error = field.getError(doc, editedLocale.value!);
    }

    return !displayErrors();
  }

  // The outing on the phone instead of on Camptocamp (src/stores/outing-queue.ts): published later from Favourites.
  // routeNote: the route could not be found, the user says which one it is
  // unanswered: sent to the API without an answer, it may be published already (see classifyFailure)
  async function keepOnPhone(
    message: string,
    type: 'is-success' | 'is-warning' = 'is-success',
    routeNote = '',
    unanswered = false
  ) {
    // a second tap while the first one saves would queue the outing twice
    if (saving.value) {
      return;
    }
    saving.value = true;
    try {
      if (draftId.value) {
        if (!(await queue().edit(draftId.value, document.value!, unanswered))) {
          toast({
            message: globals.$gettext(
              'This outing is no longer waiting: it was published or removed meanwhile. Your changes are not saved: copy them before leaving the page.'
            ),
            type: 'is-danger',
            position: 'center',
          });
          return;
        }
      } else {
        await queue().add(document.value!, routeNote, author ?? globals.$user.id, unanswered);
      }
      modified.value = false;
      toast({ message, type, position: 'center', duration: 6000 });
      router.push({ name: 'offline' });
    } catch {
      toast({
        message: globals.$gettext('Could not save your outing on the phone. Please try again.'),
        type: 'is-danger',
        position: 'center',
      });
    } finally {
      saving.value = false;
    }
  }

  function saveWithoutPublishing() {
    if (isValid()) {
      void keepOnPhone(globals.$gettext('Outing saved on the phone, not published. Publish it from Favourites.'));
    }
  }

  function save(comment: string) {
    if (lang.value === 'eu' && !globals.$user.isModerator) {
      // one line: the catalog turns a line break into a space, and the message would not match its translations
      toast({
        message: globals.$gettext(
          "Sorry, euskara lang has been frozen. We're looking for a moderator, if you're interested, please contact board@camptocamp.org"
        ),
        type: 'is-danger',
        position: 'center',
      });
      return;
    }

    if (!isValid()) {
      return;
    }
    const doc = document.value!;

    if (draftId.value) {
      void keepOnPhone(globals.$gettext('Outing updated on the phone. Publish it from Favourites when it is ready.'));
      return;
    }
    // a new outing without a network: on the phone, published later
    const keepable = mode.value === 'add' && documentType.value === 'outing';
    if (keepable && !offline.online) {
      void keepOnPhone(
        globals.$gettext('Outing saved on the phone. Publish it from Favourites once the network is back.')
      );
      return;
    }

    let request;

    saving.value = true;

    if (mode.value === 'edit') {
      request = service(documentType.value)
        .save(doc as { document_id: number }, comment)
        .then(async () => {
          modified.value = false;
          await Promise.resolve(hooks.afterSaved?.(doc)).catch(() => undefined);
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
      // no answer (the network went), or a session that expired meanwhile: kept rather than lost. Without an answer
      // it may be on the site already: it waits for the user's check, not published again blindly
      const status = (error as { response?: { status?: number } })?.response?.status;
      if (keepable && status === 401) {
        void keepOnPhone(
          globals.$gettext(
            'Your session expired: the outing is saved on the phone. Sign in, then publish it from Favourites.'
          ),
          'is-warning'
        );
        return;
      }
      if (keepable && status === undefined) {
        void keepOnPhone(
          globals.$gettext(
            'No answer from Camptocamp: the outing may be published already. It is saved on the phone: check on the site, then decide from Favourites.'
          ),
          'is-warning',
          '',
          true
        );
        return;
      }
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
    draftId,
    keepOnPhone,
    saveWithoutPublishing,
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
