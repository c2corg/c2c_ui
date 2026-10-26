import type { Api, DocumentId, DocumentRef } from './types';

export default class AssociationService {
  constructor(private api: Api) {}

  create(parent: DocumentRef, child: DocumentRef) {
    const pType = parent.type;
    const cType = child.type;

    let data: { parent_document_id: DocumentId; child_document_id: DocumentId };

    // https://github.com/c2corg/v6_ui/blob/c9962a6c3bac0670eab732d563f9f480379f84d1/c2corg_ui/static/js/addassociation.js#L91
    // parent and child type are predetermined
    if (
      (pType === 'c' && ['w', 'o', 'r', 'b', 'c', 'x', 'u'].includes(cType)) ||
      pType === 'i' ||
      (pType === 'o' && (cType === 'r' || cType === 'u')) ||
      (pType === 'r' && (cType === 'w' || cType === 'b')) ||
      (pType === 'w' && cType === 'b') ||
      (pType === 'x' && ['w', 'o', 'r', 'u'].includes(cType))
    ) {
      data = { parent_document_id: child.document_id, child_document_id: parent.document_id };
    } else {
      data = { parent_document_id: parent.document_id, child_document_id: child.document_id };
    }

    return this.api.post('/associations', data);
  }

  remove(parent: DocumentRef, child: DocumentRef) {
    const data = {
      parent_document_id: parent.document_id,
      child_document_id: child.document_id,
    };

    return this.api.delete('/associations', { data });
  }

  getHistory(params: { documentId?: DocumentId; userId?: DocumentId; limit?: number; offset?: number }) {
    let url = '/associations-history';
    const query: string[] = [];

    const addFilter = function (key: string, value: unknown) {
      if (value) {
        query.push(`${key}=${value}`);
      }
    };

    addFilter('d', params.documentId);
    addFilter('u', params.userId);
    addFilter('limit', params.limit);
    addFilter('offset', params.offset);

    if (query.length !== 0) {
      url += '?' + query.join('&');
    }

    return this.api.get(url);
  }
}
