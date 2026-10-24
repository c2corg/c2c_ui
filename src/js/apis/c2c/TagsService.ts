import type { Api, DocumentRef } from './types';

function checkDocumentType(type: string) {
  if (type !== 'r') {
    // As for now, only routes may be tagged.
    throw new Error('Tags are not supported for this kind of document');
  }
}

export default class TagsService {
  constructor(private api: Api) {}

  async add({ type, document_id }: DocumentRef) {
    checkDocumentType(type);
    return this.api.post('/tags/add', { document_id });
  }

  remove({ type, document_id }: DocumentRef) {
    checkDocumentType(type);
    return this.api.post('/tags/remove', { document_id });
  }

  get({ type, document_id }: DocumentRef) {
    checkDocumentType(type);
    return this.api.get('/tags/has/' + document_id);
  }
}
