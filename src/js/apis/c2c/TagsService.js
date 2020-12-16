function TagsService(api) {
  this.api = api;
}

TagsService.prototype.add = async function ({ type, document_id }) {
  if (type !== 'r') {
    // As for now, only routes may be tagged.
    throw new Error('Tags are not supported for this kind of document');
  }
  return this.api.post('/tags/add', { document_id });
};

TagsService.prototype.remove = function ({ document_id }) {
  return this.api.post('/tags/remove', { document_id });
};

TagsService.prototype.get = function ({ document_id }) {
  return this.api.get('/tags/has/' + document_id);
};

export default TagsService;
