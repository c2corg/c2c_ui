// the query keys holding the settings of the map, apart from its own module: the router and the lists read them without
// loading the map. None is a search parameter of the lists of documents (the map keeps the other keys of the query)
export const MAP_URL_KEYS = ['layer', 'slopes', 'overlays', 'protection', 'pin'];

// what a list of documents shows: the results, the map or both (DocumentsView)
export const VIEW_URL_KEY = 'view';

// the markers of the map all in the colour of the site (monochrome=true): the map of the site shows their categories
export const MONOCHROME_URL_KEY = 'monochrome';

// the keys of the query of a list that set how it is shown, not which documents: they are no search filters
export const DISPLAY_URL_KEYS = [...MAP_URL_KEYS, VIEW_URL_KEY, MONOCHROME_URL_KEY];

// the query without the display settings: the search filters of a list of documents
export function withoutDisplaySettings<T>(query: Record<string, T>): Record<string, T> {
  return Object.fromEntries(Object.entries(query).filter(([key]) => !DISPLAY_URL_KEYS.includes(key)));
}
