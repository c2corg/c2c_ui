/*
 * Small helper function to associate queries to a list of documents
 *
 * The documents are assumed to be the result of the query. The query associated
 * to a document is the original query, but limited to 10 documents before, and
 * 10 documents after.
 */

export const add_search_queries = function (query, documents) {
  let add_query = (document, i) => {
    let offset = query.offset ? query.offset : '0';
    let index = parseInt(offset) + i; // index in the whole list of search results
    let search_query = Object.assign({}, query);
    search_query.offset = Math.max(0, index - 10); // We take 10 results before index
    search_query.limit = index + 1 + 10 - search_query.offset; // And 10 results after index
    document.search_query = search_query;
  };
  if (documents !== null) documents.forEach(add_query);
};
