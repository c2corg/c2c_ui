// What /metaskirando remembers in the browser: the default areas of an anonymous visitor, and what each source showed
// at the last visits (for "new since last visit"; the legacy site used cookies). The storage can be missing or refuse
// writes (private window, blocked site data): every access is guarded, and the page works without it.
import { toId } from './text-filter';

const AREAS_KEY = 'metaskirando.areas';
const VISITS_KEY = 'metaskirando.visits';

function read(key: string): unknown {
  try {
    const raw = window.localStorage.getItem(key);
    return raw === null ? undefined : JSON.parse(raw);
  } catch {
    return undefined;
  }
}

function write(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // not remembered
  }
}

function remove(key: string) {
  try {
    window.localStorage.removeItem(key);
  } catch {
    // nothing to forget
  }
}

/** The ids of the default areas of an anonymous visitor (those in storage that are not ids are dropped) */
export function readDefaultAreaIds(): number[] {
  const value = read(AREAS_KEY);
  return Array.isArray(value) ? value.map(toId).filter((id): id is number => id !== null) : [];
}

/** Remembers these areas as the default ones; none forgets them */
export function writeDefaultAreaIds(ids: number[]) {
  if (ids.length) {
    write(AREAS_KEY, ids);
  } else {
    remove(AREAS_KEY);
  }
}

// ---- new since the last visit

// what the storage holds for a source: the ids shown at its last visit(s)
export type SourceVisit = {
  // the ids seen up to now, the most recent ones (capped)
  seen: string[];
  // the ids seen before this visit started: what "new" is compared with. Null at the first visit: nothing is new
  baseline: string[] | null;
  // when this visit started (ms): a reload within VISIT_GAP is the same visit
  at: number;
};
export type Visits = Record<string, SourceVisit>;

export function readVisits(): Visits {
  const value = read(VISITS_KEY);
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }
  const visits: Visits = {};
  for (const [source, visit] of Object.entries(value as Record<string, Partial<SourceVisit>>)) {
    const isIds = (ids: unknown): ids is string[] => Array.isArray(ids) && ids.every((id) => typeof id === 'string');
    if (visit && isIds(visit.seen) && (visit.baseline === null || isIds(visit.baseline)) && Number.isFinite(visit.at)) {
      visits[source] = visit as SourceVisit;
    }
  }
  return visits;
}

export function writeVisits(visits: Visits) {
  write(VISITS_KEY, visits);
}
