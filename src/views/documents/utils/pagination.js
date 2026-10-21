const ELLIPSIS = null;

/**
 * Page numbers (1-based) to display, with null standing for a gap: first and last pages, and `around` pages on each
 * side of the current one.
 */
export function getPages(currentPage, pageCount, around = 1) {
  const pages = [];

  if (!Number.isFinite(pageCount)) {
    return pages;
  }

  let previous = 0;

  for (let page = 1; page <= pageCount; page++) {
    if (page === 1 || page === pageCount || Math.abs(page - currentPage) <= around) {
      if (page - previous === 2) {
        pages.push(previous + 1); // a gap of a single page is shown as is
      } else if (page - previous > 2) {
        pages.push(ELLIPSIS);
      }
      pages.push(page);
      previous = page;
    }
  }

  return pages;
}
