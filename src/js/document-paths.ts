// The path of the pages of a document type in the UI: /routes, /routes/123... The topographic maps are at /papermaps, /map
// being the map of the site. The API keeps /<type>s for all of them.
export const documentPathPrefix = (documentType: string) =>
  '/' + (documentType === 'map' ? 'papermap' : documentType) + 's';
