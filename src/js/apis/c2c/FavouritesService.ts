// The favourites of the user, on their account (v6_api c2corg_api/views/favourite.py): any document of the savable
// types, in folders of their own. All requests need a session.
import type { Api, DocumentId } from './types';

// a favourite as the API lists it: its type is a letter (r, w, o, c, b, x)
export interface ApiFavourite {
  document_id: number;
  type: string;
  folder_id: number | null;
  created_at: string;
  lang: string | null;
  title: string | null;
  title_prefix?: string | null;
}

export interface ApiFavouriteFolder {
  id: number;
  name: string;
  position: number;
  created_at: string;
}

export default class FavouritesService {
  constructor(private api: Api) {}

  // pl: the preferred language of the titles
  list(lang?: string) {
    return this.api.get<{ favourites: ApiFavourite[]; folders: ApiFavouriteFolder[] }>('/favourites', {
      params: lang ? { pl: lang } : undefined,
    });
  }

  has(documentId: DocumentId) {
    return this.api.get<{ favourite: boolean; folder_id: number | null }>(`/favourites/has/${documentId}`);
  }

  // idempotent; with a folder, a favourite already there moves to it
  add(documentId: DocumentId, folderId?: number | null) {
    return this.api.post<object>('/favourites/add', {
      document_id: documentId,
      ...(folderId ? { folder_id: folderId } : {}),
    });
  }

  // idempotent
  remove(documentId: DocumentId) {
    return this.api.post<object>('/favourites/remove', { document_id: documentId });
  }

  move(documentId: DocumentId, folderId: number | null) {
    return this.api.post<object>('/favourites/move', { document_id: documentId, folder_id: folderId });
  }

  createFolder(name: string) {
    return this.api.post<ApiFavouriteFolder>('/favourites/folders', { name });
  }

  renameFolder(id: number, name: string) {
    return this.api.put<ApiFavouriteFolder>(`/favourites/folders/${id}`, { name });
  }

  // its favourites stay, without a folder
  deleteFolder(id: number) {
    return this.api.delete<object>(`/favourites/folders/${id}`);
  }

  orderFolders(folderIds: number[]) {
    return this.api.post<{ folders: ApiFavouriteFolder[] }>('/favourites/folders/order', { folder_ids: folderIds });
  }
}
