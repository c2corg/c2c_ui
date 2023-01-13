import { clear, del, get, keys, set, values } from 'idb-keyval';
import Vue from 'vue';

import c2c from '@/js/apis/c2c';
import config from '@/js/config';
import { filenames } from '@/js/image-formats';

const offlineEventEmitter = new Vue();
const offlineDocumentTypes = ['r', 'o', 'w', 'a', 'i', 'b', 'x'];

const documentId = (type, id, lang) => `${type}/${id}/${lang}`;

const embeddedImageRegex = /<img[^<>]+c2c:document-id="(\d+)"[^<>]+>/gm;

const embeddedImagesIds = (cooked) => {
  if (typeof cooked === 'string') {
    const embeddedImagesArray = [];
    let embeddedImageExec;
    while ((embeddedImageExec = embeddedImageRegex.exec(cooked)) !== null) {
      embeddedImagesArray.push(embeddedImageExec[1]);
    }
    return embeddedImagesArray;
  }
  return Object.values(cooked)
    .filter((field) => typeof field === 'string')
    .flatMap((field) => embeddedImagesIds(field));
};

export default function install(Vue) {
  const offlineVm = new Vue({
    name: 'Offline',

    data() {
      return {
        online: navigator.onLine,
      };
    },

    async created() {
      window.addEventListener('online', this.updateOnlineStatus);
      window.addEventListener('offline', this.updateOnlineStatus);
    },

    beforeDestroy() {
      window.removeEventListener('online', this.updateOnlineStatus);
      window.removeEventListener('offline', this.updateOnlineStatus);
    },

    methods: {
      updateOnlineStatus(e) {
        const { type } = e;
        this.online = type === 'online';
        offlineEventEmitter.$emit('offline', !this.online);
      },

      isOffline() {
        return !this.online;
      },

      onChange(callback) {
        offlineEventEmitter.$on('offline', callback);
      },

      getOfflineDocumentTypes() {
        return [...offlineDocumentTypes];
      },

      async getDocument(type, id, lang) {
        return get(documentId(type, id, lang));
      },

      async getImage(name) {
        return get(name);
      },

      async setDocument(type, id, lang, content) {
        set(documentId(type, id, lang), content);
        if (type === 'images') {
          for (const filename of filenames(content)) {
            await fetch(config.urls.media + '/' + filename, {
              cache: 'reload',
            })
              .then((response) => response.blob())
              .then((blob) => set(filename.replace(/\.[^/.]+$/, ''), blob));
          }
        }
        for (const embeddedImageId of embeddedImagesIds(content.cooked)) {
          c2c.image
            .getCooked(embeddedImageId, lang)
            .then(({ data }) => this.setDocument('images', embeddedImageId, lang, data));
        }
      },

      async deleteDocument(type, id) {
        (await keys())
          .filter((key) => key.startsWith(`${type}/${id}`))
          .forEach(async (key) => {
            if (type === 'images') {
              const doc = await get(key);
              for (const filename of filenames(doc)) {
                del(filename.replace(/\.[^/.]+$/, ''));
              }
            }
            del(key);
          });
      },

      async getAllDocuments() {
        return (await values()).filter((value) => typeof value !== 'string' && !(value instanceof Blob));
      },

      async clear(type = undefined) {
        if (type) {
          const fullType = this.$documentUtils.getDocumentType(type) + 's';
          const docTypeRegex = new RegExp(`(${fullType})\\/(\\d+)\\/[a-z]{2}`);
          (await keys())
            .map((key) => {
              const res = docTypeRegex.exec(key);
              if (!res) {
                return undefined;
              }
              return [res[1], res[2]];
            })
            .filter((res) => !!res)
            .forEach(([type, id]) => this.deleteDocument(type, id));
        } else {
          clear();
        }
      },
    },
  });

  Vue.prototype.$offline = offlineVm;
}
