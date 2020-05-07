const events = require("events");

class AbstractService {
  constructor(id) {
    this._isRunning = false;

    this.EVENTS = {
      STARTED: "STARTED",
      STOPPED: "STOPPED",
      ERROR: "ERROR",
    };

    this.id = id;
    this.emitter = new events.EventEmitter();
  }

  set isRunning(newVal) {
    if (newVal === true) {
      this.emit(this.EVENTS.STARTED);
    } else {
      this.emit(this.EVENTS.STOPPED);
    }
    this._isRunning = newVal;
  }

  get isRunning() {
    return this._isRunning;
  }

  on(event, listener) {
    this.emitter.on(event, listener);
  }

  off(event, listener) {
    this.emitter.off(event, listener);
  }

  emit(event, ...payload) {
    this.emitter.emit(event, ...payload);
  }

  start() {
    // ABSTRACT
  }

  stop() {
    // ABSTRACT
  }
}

module.exports = AbstractService;
