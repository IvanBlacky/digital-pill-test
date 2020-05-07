const sleep = require("then-sleep");

const config = require("../../data/config.json");
const createRedisClient = require("../../common/redis");
const Redlock = require("redlock");

const AbstractService = require("../AbstractService");

class ResourceLocker extends AbstractService {
  constructor(id) {
    super(id);

    this.EVENTS = {
      ...this.EVENTS,
      STATE_CHANGED: "STATE_CHANGED",
    };

    this._isOwner = null;
    this.redis = createRedisClient();
    this.redlock = new Redlock([this.redis]);
    this.redlock.on("clientError", (err) => {
      console.error("Redlock client error", err);
    });
  }

  set isOwner(newVal) {
    if (newVal !== this.isOwner) this.emit(this.EVENTS.STATE_CHANGED, newVal);
    this._isOwner = newVal;
  }

  get isOwner() {
    return this._isOwner;
  }

  start() {
    // starting a service should not be a blocking operation (sync or async)
    // if an entity needs to wait until the service is started it should subscribe on STARTED event
    this.isRunning = true;
    this._runTicker().catch((err) => {
      this.emit(this.EVENTS.ERROR, "Ticker error: " + err);
    });
  }

  stop() {
    this.isRunning = false;
  }

  async _runTicker() {
    const ticker = this._ticker();
    for await (const _ of ticker) {
      // nothing to do, just iterating
    }
  }

  *_ticker() {
    while (this.isRunning) {
      yield this._tick();
    }
  }

  async _tick() {
    const nextTickTimeout = await this._tryBecomeOwner();
    await sleep(nextTickTimeout);
  }

  async _tryBecomeOwner() {
    try {
      await this.redlock.lock(config.resourceOwner, config.lockTtl);
      this.isOwner = true;

      let nextAttemptTimeout;

      // applying timeout correction
      nextAttemptTimeout = this.isOwner
        ? config.lockTtl
        : config.lockTtl + config.timeoutCorrection;

      return nextAttemptTimeout;
    } catch (error) {
      this.isOwner = false;
    }
  }
}

module.exports = ResourceLocker;
