// This class is a simple worker.
// Push promise functions, and they will be called sequentially.

class Worker {
  _stack: (() => Promise<unknown>)[] = [];
  _working = false;

  push<Args extends unknown[]>(func: (...args: Args) => Promise<unknown>, ...args: Args) {
    const partial = () => func(...args);
    this._stack.push(partial);
    this._work();
  }
  _next() {
    this._working = false;
    this._work();
  }
  _work() {
    if (this._working || this._stack.length === 0) {
      return;
    }
    const partial = this._stack.shift() as () => Promise<unknown>;
    this._working = true;
    partial().then(this._next.bind(this)).catch(this._next.bind(this));
  }
}

export default Worker;
