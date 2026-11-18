// An activity of a tracker (Strava, Garmin...) picked for an outing (OutingTracePicker.vue): its trace, its day, its
// distance and elevation gain go into the form; given back when the trace is cleared or replaced, the fields the user
// did not change since return to what they were.
import type { Activity } from '@/js/apis/tracking-service';
import type { C2cDocument } from '@/js/vue-plugins/document-utils';

type Figures = Partial<Record<'length_total' | 'height_diff_up', number>>;

export type TracePick = {
  id: number;
  doc: C2cDocument;
  day: string;
  figures: Figures;
  before: { date_start?: string; date_end?: string; several: boolean } & Figures;
};

// what the activity gives, and what the form had: before the pick is written
export function readTracePick(doc: C2cDocument, activity: Activity, day: string, several: boolean): TracePick {
  const figures: Figures = {};
  if (activity.length) {
    figures.length_total = Math.round(activity.length);
  }
  if (activity.heightDiffUp) {
    figures.height_diff_up = Math.round(activity.heightDiffUp);
  }
  const before: TracePick['before'] = { date_start: doc.date_start, date_end: doc.date_end, several };
  for (const key of Object.keys(figures) as (keyof Figures)[]) {
    before[key] = doc[key] as number | undefined;
  }
  return { id: activity.id, doc, day, figures, before };
}

// the activity's day (one day) and figures in the form
export function writeTracePick({ doc, figures, day }: TracePick) {
  Object.assign(doc, figures, { date_start: day, date_end: day });
}

// the fields still as the pick wrote them go back; returns whether the outing lasts several days
export function giveBackTracePick({ doc, before, figures, day }: TracePick, several: boolean) {
  for (const [key, value] of Object.entries(figures) as [keyof Figures, number][]) {
    if (doc[key] === value) {
      (doc as Record<string, unknown>)[key] = before[key];
    }
  }
  if (several || doc.date_start !== day) {
    return several;
  }
  doc.date_start = before.date_start;
  doc.date_end = before.date_end;
  return before.several;
}
