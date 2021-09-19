function DocumentService(api, documentType) {
  this.documentType = documentType;
  this.api = api;
}

DocumentService.prototype.getAll = function (params) {
  return this.api.get('/' + this.documentType + 's', { params });
};

DocumentService.prototype.fullDownload = function (params, limit, onProgress) {
  // will load the ENTIRE list of document. Limited to 2000 docs

  const MAX_SIZE = 2000;
  const API_MAX_LIMIT = 100;

  let cancelled = false;

  limit = limit || MAX_SIZE;
  limit = limit > MAX_SIZE ? MAX_SIZE : limit;

  class CancelablePromise extends Promise {
    cancel() {
      cancelled = true;
    }
  }

  return new CancelablePromise((resolve, reject) => {
    const result = [];

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
};

DocumentService.prototype.get = function (id, lang) {
  return this.api.get('/' + this.documentType + 's/' + id, { params: { l: this.api.getApiLang(lang) } });
};

DocumentService.prototype.getCooked = function (id, prefered_lang) {
  // chinese is not yet present as topoguide lang, so default it to english
  prefered_lang = this.api.getApiLang(prefered_lang);
  const promise = this.api.get('/' + this.documentType + 's/' + id + `?cook=${prefered_lang}`);

  return promise;
};

DocumentService.prototype.getVersion = function (id, lang, versionId) {
  const url = '/' + this.documentType + 's/' + id + '/' + this.api.getApiLang(lang) + '/' + versionId;
  return this.api.get(url);
};

DocumentService.prototype.save = function (document, comment) {
  return this.api.put('/' + this.documentType + 's/' + document.document_id, {
    document,
    message: comment,
  });
};

DocumentService.prototype.create = function (document) {
  return this.api.post('/' + this.documentType + 's', document);
};

DocumentService.prototype.getHistory = function (document_id, lang) {
  return this.api.get('/document/' + document_id + '/history/' + this.api.getApiLang(lang));
};

export default DocumentService;
