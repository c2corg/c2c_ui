// The toasts of the site: a notification (`.notification.is-danger`...) shown for a few seconds, in place of
// bulma-toast (c2corg/c2c_ui#4907). A string message is shown as text, never as HTML: messages can come from the URL
// or from the API. For a formatted message, give an element.

export type ToastPosition =
  'top-left' | 'top-right' | 'top-center' | 'bottom-left' | 'bottom-right' | 'bottom-center' | 'center';

export interface ToastOptions {
  /** The text of the toast, or an element shown as it is (moved into the toast) */
  message: string | Element;
  /** The color class of the notification: 'is-danger', 'is-info'... */
  type?: string;
  position?: ToastPosition;
  /** In milliseconds */
  duration?: number;
  /** The time does not run while the mouse is over the toast */
  pauseOnHover?: boolean;
  /** A close button */
  dismissible?: boolean;
  /** A click on the toast closes it */
  closeOnClick?: boolean;
  /** The other toasts at the same position are removed */
  single?: boolean;
}

const defaults = {
  position: 'top-right',
  duration: 3000,
  pauseOnHover: true,
  dismissible: false,
  closeOnClick: true,
  single: false,
} satisfies Omit<ToastOptions, 'message'>;

// one container per position, created with its first toast, removed with its last one
const containers = new Map<ToastPosition, HTMLElement>();

const container = (position: ToastPosition): HTMLElement => {
  let element = containers.get(position);
  if (!element) {
    element = document.createElement('div');
    element.className = 'toasts';
    element.dataset['position'] = position;
    document.body.append(element);
    containers.set(position, element);
  }
  return element;
};

export function toast(options: ToastOptions): void {
  const { message, type, position, duration, pauseOnHover, dismissible, closeOnClick, single } = {
    ...defaults,
    ...options,
  };
  const parent = container(position);
  if (single) parent.replaceChildren();

  const element = document.createElement('div');
  element.className = ['notification', 'toast', type].filter(Boolean).join(' ');
  // read out by screen readers: at once for an error or a warning
  element.setAttribute('role', type === 'is-danger' || type === 'is-warning' ? 'alert' : 'status');
  if (typeof message === 'string') element.textContent = message;
  else element.append(message);

  let timer: number | undefined;
  let remaining = duration;
  let start = 0;
  const close = () => {
    window.clearTimeout(timer);
    element.remove();
    // a toast removed by a single one may close after its container was replaced
    if (!parent.children.length && containers.get(position) === parent) {
      parent.remove();
      containers.delete(position);
    }
  };
  const resume = () => {
    start = Date.now();
    window.clearTimeout(timer);
    timer = window.setTimeout(close, remaining);
  };
  const pause = () => {
    window.clearTimeout(timer);
    remaining -= Date.now() - start;
  };

  if (dismissible) {
    const button = document.createElement('button');
    button.className = 'delete';
    button.type = 'button';
    button.addEventListener('click', close);
    element.prepend(button);
  } else {
    element.classList.add('is-plain');
  }
  if (closeOnClick) element.addEventListener('click', close);
  if (pauseOnHover) {
    element.addEventListener('mouseover', pause);
    element.addEventListener('mouseout', resume);
  }

  parent.append(element);
  resume();
}
