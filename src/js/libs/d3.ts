// let build our own d3 module, instead of a stupid `import * as d3 from 'd3'`

class D3 {
  resolved_ = false;
  resolving_ = false;
  callbacks_: (() => void)[] = [];
  resolvingCount_ = 0;
  // the loaded d3 modules: d3.scale, d3.geo... and their functions (d3.select, d3.line...), untyped
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [service: string]: any;

  resolve_() {
    if (this.resolved_ || this.resolving_) {
      return;
    }

    this.resolving_ = true;

    this.load_(import('d3-scale'), 'scale');
    this.load_(import('d3-geo'), 'geo');
    this.load_(import('d3-time'), 'time');
    this.load_(import('d3-shape'), 'shape');
    this.load_(import('d3-transition'), 'transition'); // do not forget. d3 has a strange behavior...
    this.load_(import('d3-format'), 'format');
    this.load_(import('d3-time-format'), 'timeFormat');
    this.load_(import('d3-axis'), 'axis');
    this.load_(import('d3-array'), 'array');
    this.load_(import('d3-selection'), 'selection');
  }

  load_(promise: Promise<Record<string, unknown>>, key: string) {
    this.resolvingCount_++;

    promise.then((response) => {
      if (response.default) {
        this[key] = response.default;
      } else {
        for (const service of Object.keys(response)) {
          this[service] = response[service];
        }
      }

      this.resolvingCount_--;

      if (this.resolvingCount_ === 0) {
        this.resolving_ = false;
        this.resolved_ = true;
        this.postResolve_();
      }
    });
  }

  postResolve_() {
    for (const callback of this.callbacks_) {
      callback();
    }
  }

  then(callback: () => void) {
    this.resolve_();

    if (this.resolved_) {
      callback();
    } else {
      this.callbacks_.push(callback);
    }
  }
}

export default new D3();
