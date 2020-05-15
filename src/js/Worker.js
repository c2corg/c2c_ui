// This class is a simple worker.
// Push promise functions, and they will be called sequentially.

class Worker {
  constructor() {
    this._stack = [];
    this._working = false;
  }
  push(func, ...args) {
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
    const partial = this._stack.shift();
    this._working = true;
    partial().then(this._next.bind(this)).catch(this._next.bind(this));
  }
}

export default Worker;
