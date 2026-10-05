/*
 * Returns a function that runs async tasks with at most `max` of them in flight.
 * Used where a page would otherwise fire one API request per document at once
 * (printing view, public transport boxes) and trip the API's per-IP rate limit.
 */
export default function concurrencyLimit(max) {
  const queue = [];
  let active = 0;

  const next = () => {
    if (active >= max || queue.length === 0) {
      return;
    }

    const { task, resolve, reject } = queue.shift();
    active++;

    Promise.resolve()
      .then(task)
      .then(resolve, reject)
      .finally(() => {
        active--;
        next();
      });
  };

  return (task) =>
    new Promise((resolve, reject) => {
      queue.push({ task, resolve, reject });
      next();
    });
}
