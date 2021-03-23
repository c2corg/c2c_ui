function DocumentService(api, documentType) {
  this.documentType = documentType;
  this.api = api;
}

DocumentService.prototype.getAll = function (params) {
  return this.api.get('/' + this.documentType + 's', { params });
};

DocumentService.prototype.fullDownload = function (params, limit, progress) {
  // will load the ENTIRE list of document. Limited to 2000 docs
  const this_ = this;

  limit = limit || 2000;
  params = { ...params }; // clone

  return new Promise((resolve, reject) => {
    const result = [];

    params.limit = 100;

    const download = function (offset) {
      params.offset = offset;

      this_
        .getAll(params)
        .then((response) => {
          for (const document of response.data.documents) {
            result.push(document);
          }

          if (progress) {
            progress(result.length, response.data.total);
          }

          if (response.data.documents.length === 0) {
            resolve(result);
          } else if (result.length === response.data.total) {
            resolve(result);
          } else if (result.length >= limit) {
            resolve(result);
          } else {
            download(offset + 100);
          }
        })
        .catch((error) => {
          reject(error);
        });
    };

    download(0);
  });
};

DocumentService.prototype.get = function (id, lang) {
  return this.api.get('/' + this.documentType + 's/' + id, { params: { l: lang } });
};

DocumentService.prototype.getCooked = function (id, prefered_lang) {
  // chinese is not yet present as topoguide lang, so default it to english
  prefered_lang = prefered_lang === 'zh_CN' ? 'en' : prefered_lang;
  const promise = this.api.get('/' + this.documentType + 's/' + id + `?cook=${prefered_lang}`);

  return promise;
};

DocumentService.prototype.getVersion = function (id, lang, versionId) {
  const url = '/' + this.documentType + 's/' + id + '/' + lang + '/' + versionId;
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
  return this.api.get('/document/' + document_id + '/history/' + lang);
};

export default DocumentService;
