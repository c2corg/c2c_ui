/*
 * Returns a function that runs async tasks with at most `max` of them in flight.
 * Used where a page would otherwise fire one API request per document at once
 * (printing view, public transport boxes) and trip the API's per-IP rate limit.
 */
type Task<T> = () => T | PromiseLike<T>;

type Queued = { task: Task<unknown>; resolve: (value: unknown) => void; reject: (reason: unknown) => void };

export default function concurrencyLimit(max: number): <T>(task: Task<T>) => Promise<T> {
  const queue: Queued[] = [];
  let active = 0;

  const next = () => {
    if (active >= max || queue.length === 0) {
      return;
    }

    const { task, resolve, reject } = queue.shift() as Queued;
    active++;

    Promise.resolve()
      .then(task)
      .then(resolve, reject)
      .finally(() => {
        active--;
        next();
      });
  };

  return <T>(task: Task<T>) =>
    new Promise<T>((resolve, reject) => {
      queue.push({ task, resolve: resolve as (value: unknown) => void, reject });
      next();
    });
}
