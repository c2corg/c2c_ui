// A new version of the app reloads the page, but never under a form being filled
import { describe, expect, it, vi } from 'vitest';
import { type RouteLocationNormalized, type Router } from 'vue-router';

import { reloadOutOfForms } from './register-service-worker';

const route = (name: string) => ({ name }) as unknown as RouteLocationNormalized;

// a router on a route, whose afterEach hooks the test can call
const fakeRouter = (current: string) => {
  const hooks: ((to: RouteLocationNormalized, from: RouteLocationNormalized) => void)[] = [];
  const router = {
    currentRoute: { value: route(current) },
    afterEach: (hook: (typeof hooks)[number]) => hooks.push(hook),
  } as unknown as Router;
  const navigate = (from: string, to: string) => hooks.forEach((hook) => hook(route(to), route(from)));
  return { router, navigate };
};

describe('reloadOutOfForms', () => {
  it('reloads at once out of a form', () => {
    const reload = vi.fn();
    reloadOutOfForms(fakeRouter('home').router, reload);
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it('waits for the form, and for the page reached by leaving it', () => {
    const reload = vi.fn();
    const { router, navigate } = fakeRouter('outing-add');
    reloadOutOfForms(router, reload);
    expect(reload).not.toHaveBeenCalled();

    navigate('outing-add', 'outing'); // the saved outing, with its confirmation
    expect(reload).not.toHaveBeenCalled();
    navigate('outing', 'outing'); // the same page rewriting its address
    expect(reload).not.toHaveBeenCalled();

    navigate('outing', 'home');
    expect(reload).toHaveBeenCalledTimes(1);
  });
});
