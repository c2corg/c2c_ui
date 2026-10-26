// https://github.com/c2corg/v6_api/blob/3a5d5202da0ee49903b7ce495e141c41dce27892/c2corg_api/views/forum.py

import type { Api, DocumentId } from './types';

export default class ForumService {
  constructor(private api: Api) {}

  getPrivateMessagesCount() {
    return this.api.get('/forum/private-messages/unread-count');
  }

  createTopic(document_id: DocumentId, lang: string) {
    return this.api.post('/forum/topics', { document_id, lang });
  }
}
