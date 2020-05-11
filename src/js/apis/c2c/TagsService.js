function TagsService(api) {
  this.api = api;
}

TagsService.prototype.add = function (document) {
  if (document.type !== 'r') {
    // As for now, only routes may be tagged.
    return Promise.reject(new Error('Tags are not supported for this type of documents'));
  }

  const data = {
    document_id: document.document_id,
  };

  return this.api.post('/tags/add', data);
};

TagsService.prototype.remove = function (document) {
  const data = {
    document_id: document.document_id,
  };

  return this.api.post('/tags/remove', data);
};

TagsService.prototype.get = function (document) {
  return this.api.get('/tags/has/' + document.document_id);
};

export default TagsService;
