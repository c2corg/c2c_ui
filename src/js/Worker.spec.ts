import { describe, expect, it } from 'vitest';

import Worker from './Worker';

describe('Worker', () => {
  it('runs the pushed tasks one after the other, also after a failure', async () => {
    const worker = new Worker();
    const order: string[] = [];
    const task = (name: string, fail = false) =>
      new Promise<void>((resolve, reject) =>
        setTimeout(() => {
          order.push(name);
          (fail ? reject : resolve)();
        })
      );

    worker.push(task, 'first', true);
    worker.push(task, 'second');
    worker.push(task, 'third');
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(order).toEqual(['first', 'second', 'third']);
  });
});
