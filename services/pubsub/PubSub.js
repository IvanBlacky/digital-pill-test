const createRedisClient = require("../../common/redis");
// const ResourceLocker = require("./ResourceLocker");
const ResourceLocker = require("./ResourceLocker");
const AbstractService = require("../AbstractService");

class PubSub extends AbstractService {
  constructor(id, channelName = "channel") {
    super(id);
    this.channelName = channelName;

    this.ROLES = {
      SUBSCRIBER: "SUBSCRIBER",
      PUBLISHER: "PUBLISHER",
    };

    this.EVENTS = {
      ...this.EVENTS,
      ROLE_CHANGED: "ROLE CHANGED",
    };

    this.redis = createRedisClient();
    this.resourceLocker = new ResourceLocker(this.id);

    // this is for ability of setting multiple processors for one message
    this.processors = [];
  }

  set role(newValue) {
    // for tracking the pub/sub app role state purposes
    this.emit(this.EVENTS.ROLE_CHANGED, newValue);
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;

    this._setListeners();
    this.resourceLocker.start();
  }

  stop() {
    if (!this.isRunning) return;
    this.isRunning = false;

    this._removeListeners();
    this.pubService.stop();
    this.subService.stop();
    this.resourceLocker.stop();
  }

  addProcessor(processor) {
    this.processors.push(processor);
  }

  setPubService(pubService) {
    if (this.pubService) {
      this.pubService.stop();
    }

    this.pubService = pubService;
  }

  setSubService(subService) {
    if (this.subService) {
      this.subService.stop();
      this.subService.off(
        this.subService.EVENTS.NEW_MESSAGE,
        this._newMessageEventListener.bind(this)
      );
    }

    this.subService = subService;
    this.subService.on(
      this.subService.EVENTS.NEW_MESSAGE,
      this._newMessageEventListener.bind(this)
    );
  }

  _setListeners() {
    this.stateChangedListener = this._setState.bind(this);
    this.resourceLocker.on(
      this.resourceLocker.EVENTS.STATE_CHANGED,
      this.stateChangedListener
    );
  }

  _removeListeners() {
    this.resourceLocker.off(
      this.resourceLocker.EVENTS.STATE_CHANGED,
      this.stateChangedListener
    );
  }

  _setState(isOwner) {
    if (isOwner) {
      this.role = this.ROLES.PUBLISHER;
      this.subService.stop();
      this.pubService.start();
    } else {
      this.role = this.ROLES.SUBSCRIBER;
      this.pubService.stop();
      this.subService.start();
    }
  }

  async _newMessageEventListener(message) {
    // for multiple processors support
    const processPromises = [];
    for (const processor of this.processors) {
      processPromises.push(processor.processMessage(message));
    }

    await Promise.all(processPromises).catch((err) => {
      this.emit(
        this.EVENTS.ERROR,
        "Error during processing message " + message + "/nError: " + err
      );
    });
  }
}

module.exports = PubSub;
