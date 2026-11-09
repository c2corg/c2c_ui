import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { toast } from './toast';

const toasts = () => [...document.querySelectorAll<HTMLElement>('.toast')];

describe('toast', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runAllTimers();
    vi.useRealTimers();
    document.body.replaceChildren();
  });

  it('shows a string as text, not HTML', () => {
    toast({ message: '<img src="x" onerror="alert(1)">' });

    expect(toasts()).toHaveLength(1);
    expect(toasts()[0]!.textContent).toBe('<img src="x" onerror="alert(1)">');
    expect(document.querySelector('img')).toBeNull();
  });

  it('shows an element as it is', () => {
    const list = document.createElement('ul');
    list.innerHTML = '<li>a</li><li>b</li>';

    toast({ message: list });

    expect(toasts()[0]!.querySelectorAll('li')).toHaveLength(2);
  });

  it('is a notification of the color of its type, an alert for an error', () => {
    toast({ message: 'error', type: 'is-danger' });
    toast({ message: 'done', type: 'is-primary' });

    expect(toasts().map((element) => element.className)).toEqual([
      'notification toast is-danger is-plain',
      'notification toast is-primary is-plain',
    ]);
    expect(toasts().map((element) => element.getAttribute('role'))).toEqual(['alert', 'status']);
  });

  it('closes after its duration, 3 seconds by default', () => {
    toast({ message: 'a' });
    toast({ message: 'b', duration: 5000 });

    vi.advanceTimersByTime(2999);
    expect(toasts()).toHaveLength(2);
    vi.advanceTimersByTime(1);
    expect(toasts().map((element) => element.textContent)).toEqual(['b']);
    vi.advanceTimersByTime(2000);
    expect(toasts()).toHaveLength(0);
  });

  it('waits while the mouse is over it', () => {
    toast({ message: 'a' });
    const element = toasts()[0]!;

    vi.advanceTimersByTime(1000);
    element.dispatchEvent(new MouseEvent('mouseover'));
    vi.advanceTimersByTime(10000);
    expect(toasts()).toHaveLength(1);
    element.dispatchEvent(new MouseEvent('mouseout'));
    vi.advanceTimersByTime(1999);
    expect(toasts()).toHaveLength(1);
    vi.advanceTimersByTime(1);
    expect(toasts()).toHaveLength(0);
  });

  it('closes on a click, or with its button when dismissible', () => {
    toast({ message: 'a' });
    toasts()[0]!.click();
    expect(toasts()).toHaveLength(0);

    toast({ message: 'b', dismissible: true, closeOnClick: false });
    toasts()[0]!.click();
    expect(toasts()).toHaveLength(1);
    toasts()[0]!.querySelector<HTMLButtonElement>('.delete')!.click();
    expect(toasts()).toHaveLength(0);
  });

  it('has one container per position, removed with its last toast', () => {
    toast({ message: 'a', position: 'center' });
    toast({ message: 'b', position: 'top-center' });
    toast({ message: 'c', position: 'center' });

    const containers = [...document.querySelectorAll<HTMLElement>('.toasts')];
    expect(containers.map((element) => [element.dataset['position'], element.children.length])).toEqual([
      ['center', 2],
      ['top-center', 1],
    ]);

    vi.runAllTimers();
    expect(document.querySelectorAll('.toasts')).toHaveLength(0);
  });

  it('replaces the toasts of its position when single', () => {
    toast({ message: 'a', position: 'center' });
    toast({ message: 'b', position: 'top-center' });
    toast({ message: 'c', position: 'center', single: true });

    expect(toasts().map((element) => element.textContent)).toEqual(['c', 'b']);
  });
});
