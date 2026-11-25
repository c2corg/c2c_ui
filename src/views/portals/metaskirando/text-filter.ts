// The text filter of the list: client side, on the outings that are loaded.
import type { PartnerOuting } from '@/js/apis/partner-outings-service';

/** A positive integer id, from a number or a string; null for anything else */
export function toId(value: unknown): number | null {
  const id = typeof value === 'string' && value.trim() !== '' ? Number(value) : value;
  return typeof id === 'number' && Number.isInteger(id) && id > 0 ? id : null;
}

// lower case, without accents
const normalize = (text: string) => text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

// what a search matches in an outing: the title, the region, the areas and the author
const haystack = (outing: PartnerOuting) =>
  normalize(
    [outing.title, outing.region, outing.author?.name, ...outing.areas.map((area) => area.title)]
      .filter(Boolean)
      .join(' ')
  );

/** The outings that hold every word of the text (case and accents ignored); all of them for an empty text */
export function filterByText(items: PartnerOuting[], text: string): PartnerOuting[] {
  const words = normalize(text).split(/\s+/).filter(Boolean);
  return words.length ? items.filter((outing) => words.every((word) => haystack(outing).includes(word))) : items;
}
