import 'fake-indexeddb/auto';
import { clear } from 'idb-keyval';
import { beforeEach, describe, expect, it } from 'vitest';

import * as store from './offline-store';

const DAY = 24 * 3600 * 1000;

const route = (mode: store.SavedMode) => ({
  type: 'route',
  id: 12,
  lang: 'fr',
  data: { document_id: 12 },
  title: 'Arête des Cosmiques',
  folderId: null,
  mode,
});

const only = async () => {
  const entries = await store.listDocuments();
  expect(entries).toHaveLength(1);
  return entries[0];
};

describe('offline store', () => {
  beforeEach(() => clear());

  it('keeps the content of an offline document only, one copy per document', async () => {
    await store.saveDocument(route('online'));
    expect(await only()).toMatchObject({ mode: 'online', data: null, downloadedAt: null });

    await store.saveDocument({ ...route('offline'), lang: 'en' });
    const offline = await only();
    expect(store.isOfflineEntry(offline)).toBe(true);
    expect(offline.lang).toBe('en');
    expect(offline.downloadedAt).toBeTypeOf('number');

    await store.setFolder('route', 12, 'f1');
    await store.makeOnline('route', 12);
    // one set of folders for favourites and offline copies: it stays in its folder
    expect(await only()).toMatchObject({ mode: 'online', data: null, downloadedAt: null, folderId: 'f1' });
  });

  it('keeps the documents of a deleted folder, without folder', async () => {
    await store.saveFolder({ id: 'f1', name: 'Mont Blanc', section: 'online' });
    await store.saveDocument({ ...route('online'), folderId: 'f1' });
    await store.deleteFolder('f1');
    expect(await store.listFolders()).toEqual([]);
    expect((await only()).folderId).toBeNull();
  });

  it('says whether everything arrived, and how old the copy is', () => {
    const entry = { ...route('offline'), savedAt: 0, downloadedAt: 1000 } as store.SavedEntry;
    expect(store.isDownloadComplete(entry)).toBe(true);
    expect(store.isDownloadComplete({ ...entry, assets: { done: false, failed: 0 } })).toBe(false);
    expect(store.isDownloadComplete({ ...entry, assets: { done: true, failed: 2 } })).toBe(false);
    // files the browser cleared since
    expect(store.isDownloadComplete({ ...entry, assets: { done: true, failed: 0, missing: 3 } })).toBe(false);

    expect(store.freshnessOf(entry, 1000 + 6 * DAY)).toBe('fresh');
    expect(store.freshnessOf(entry, 1000 + 8 * DAY)).toBe('stale');
    expect(store.freshnessOf(entry, 1000 + 31 * DAY)).toBe('very-stale');
    expect(store.freshnessOf({ ...entry, downloadedAt: null })).toBe('unknown');
  });

  it('says what an offline copy needs, files missing first, then its age', () => {
    const entry = { ...route('offline'), savedAt: 0, downloadedAt: 1000 } as store.SavedEntry;
    const complete = { done: true, failed: 0 };
    expect(store.attentionOf({ ...entry, assets: complete }, 1000 + DAY)).toBeNull();
    expect(store.attentionOf({ ...entry, assets: complete }, 1000 + 8 * DAY)).toBe('update');
    expect(store.attentionOf({ ...entry, assets: complete }, 1000 + 31 * DAY)).toBe('expired');
    expect(store.attentionOf({ ...entry, assets: { ...complete, missing: 1 } }, 1000 + 31 * DAY)).toBe('incomplete');
    expect(store.attentionOf({ ...entry, assets: { done: true, failed: 1 } }, 1000 + DAY)).toBe('incomplete');
    // being downloaded, or a bookmark: nothing to say
    expect(store.attentionOf({ ...entry, assets: { done: false, failed: 0 } }, 1000 + 31 * DAY)).toBeNull();
    expect(store.attentionOf({ ...entry, mode: 'online', data: null }, 1000 + 31 * DAY)).toBeNull();
  });

  it('records the files an offline copy lost', async () => {
    await store.saveDocument(route('offline'));
    await store.setAssets('route', 12, { done: true, failed: 0, keys: ['a'] });
    await store.setMissing('route', 12, 1);
    expect((await only()).assets).toEqual({ done: true, failed: 0, keys: ['a'], missing: 1 });
  });
});
