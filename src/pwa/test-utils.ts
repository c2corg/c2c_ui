// An in-memory Cache Storage, what the code of src/pwa uses of it: caches.open/match/delete, cache.match/put/delete
type Key = RequestInfo | URL;
const keyOf = (request: Key) =>
  typeof request === 'string' ? request : request instanceof URL ? request.href : request.url;

export function fakeCacheStorage() {
  const stores = new Map<string, Map<string, Response>>();
  const storeOf = (name: string) => {
    if (!stores.has(name)) {
      stores.set(name, new Map());
    }
    return stores.get(name)!;
  };
  const caches = {
    async open(name: string) {
      const store = storeOf(name);
      return {
        match: async (request: Key) => store.get(keyOf(request))?.clone(),
        put: async (request: Key, response: Response) => void store.set(keyOf(request), response),
        delete: async (request: Key) => store.delete(keyOf(request)),
      };
    },
    async match(request: Key, options?: { cacheName?: string }) {
      const names = options?.cacheName ? [options.cacheName] : [...stores.keys()];
      for (const name of names) {
        const response = stores.get(name)?.get(keyOf(request));
        if (response) {
          return response.clone();
        }
      }
      return undefined;
    },
    delete: async (name: string) => stores.delete(name),
  };
  // the keys of a cache, sorted
  const keysOf = (name: string) => [...(stores.get(name)?.keys() ?? [])].sort();
  const put = (name: string, key: string, body: string) => storeOf(name).set(key, new Response(body));
  return { caches, stores, keysOf, put };
}
