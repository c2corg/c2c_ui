// the query keys holding the settings of the map, apart from its own module: the router and the lists read them without
// loading the map. None is a search parameter of the lists of documents (the map keeps the other keys of the query)
export const MAP_URL_KEYS = ['layer', 'slopes', 'overlays', 'protection', 'pin'];

// the query without the settings of the map: the search filters of a list of documents
export function withoutMapUrl<T>(query: Record<string, T>): Record<string, T> {
  return Object.fromEntries(Object.entries(query).filter(([key]) => !MAP_URL_KEYS.includes(key)));
}
