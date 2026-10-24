import type { Api, DocumentId, Params } from './types';

export default class DocumentService {
  constructor(
    private api: Api,
    private documentType: string
  ) {}

  getAll(params?: Params) {
    return this.api.get('/' + this.documentType + 's', { params });
  }

  fullDownload(params: Params, limit?: number, onProgress?: (loaded: number, total: number) => void) {
    // will load the ENTIRE list of document. Limited to 2000 docs

    const MAX_SIZE = 2000;
    const API_MAX_LIMIT = 100;

    let cancelled = false;

    limit = limit || MAX_SIZE;
    limit = limit > MAX_SIZE ? MAX_SIZE : limit;

    class CancelablePromise<T> extends Promise<T> {
      cancel() {
        cancelled = true;
      }
    }

    return new CancelablePromise<unknown[]>((resolve, reject) => {
      const result: unknown[] = [];

      const download = (offset = 0) => {
        if (cancelled) {
          return;
        }

        this.getAll({ ...params, offset, limit: API_MAX_LIMIT })
          .then(({ data }) => {
            if (cancelled) {
              return;
            }

            for (const document of data.documents) {
              result.push(document);
            }

            onProgress?.(result.length, data.total);

            if (data.documents.length === 0 || result.length === data.total || result.length >= limit) {
              resolve(result);
            } else {
              download(offset + 100);
            }
          })
          .catch((error) => {
            if (cancelled) {
              return;
            }

            reject(error);
          });
      };

      download();
    });
  }

  get(id: DocumentId, lang: string) {
    return this.api.get('/' + this.documentType + 's/' + id, { params: { l: this.api.getApiLang(lang) } });
  }

  getCooked(id: DocumentId, prefered_lang: string) {
    prefered_lang = this.api.getApiLang(prefered_lang);
    const promise = this.api.get('/' + this.documentType + 's/' + id + `?cook=${prefered_lang}`);

    return promise;
  }

  getVersion(id: DocumentId, lang: string, versionId: DocumentId) {
    const url = '/' + this.documentType + 's/' + id + '/' + this.api.getApiLang(lang) + '/' + versionId;
    return this.api.get(url);
  }

  save(document: { document_id: DocumentId }, comment: string) {
    return this.api.put('/' + this.documentType + 's/' + document.document_id, {
      document,
      message: comment,
    });
  }

  create(document: object) {
    return this.api.post('/' + this.documentType + 's', document);
  }

  getHistory(document_id: DocumentId, lang: string) {
    return this.api.get('/document/' + document_id + '/history/' + this.api.getApiLang(lang));
  }
}
