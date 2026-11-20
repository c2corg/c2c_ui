// Once a day at most, online only: a toast when offline topos need something (offline-store.ts attentionOf), with a
// button to My topos. Online, because only then can they be downloaded again: before leaving, not in the hut
import { notify } from '@/js/toast';

const LAST_REMINDER_KEY = 'c2c.offlineReminder';

const today = (now: Date) => now.toISOString().slice(0, 10);

export function shouldRemind(count: number, online: boolean, now = new Date()) {
  if (!count || !online) {
    return false;
  }
  try {
    return localStorage.getItem(LAST_REMINDER_KEY) !== today(now);
  } catch {
    // storage blocked: no reminder rather than one at every page
    return false;
  }
}

export function remind(text: string, buttonText: string, open: () => void, now = new Date()) {
  try {
    localStorage.setItem(LAST_REMINDER_KEY, today(now));
  } catch {
    return;
  }
  const message = document.createElement('div');
  message.textContent = text + ' ';
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'button is-small is-white';
  button.textContent = buttonText;
  button.addEventListener('click', open, { once: true });
  message.append(button);
  // a click on its button opens My topos and closes it
  notify(message, 'is-warning', { duration: 10000, dismissible: true });
}
