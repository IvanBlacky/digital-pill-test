const sleep = require("then-sleep");
const createRedisClient = require("../../common/redis");
const AbstractService = require("../AbstractService");

class SubscriberService extends AbstractService {
  constructor(id, channelName) {
    super(id);
    this.EVENTS = {
      ...this.EVENTS,
      NEW_MESSAGE: "NEW MESSAGE",
    };

    this.redis = createRedisClient();
    this.channelName = channelName;
  }

  // starting a service should not be a blocking operation (sync or async)
  // if an entity needs to wait until the service is started it should subscribe on STARTED event
  start() {
    if (this.isRunning) return;
    (async () => {
      this.isRunning = true;

      const messageGetter = this._messageGetter();
      for await (const message of messageGetter) {
        if (message) this.emit(this.EVENTS.NEW_MESSAGE, message);
      }
    })().catch((err) => {
      this.emit(this.EVENTS.ERROR, "Message getter error " + err);
    });
  }

  stop() {
    if (!this.isRunning) return;
    this.isRunning = false;
  }

  async *_messageGetter() {
    const getMessage = async () => {
      const message = await this._getMessageFromChannel();
      if (message) return message;
      // no messages left in MQ -> wait for 10ms and try again
      await sleep(10);
      return getMessage();
    };
    while (this.isRunning === true) {
      yield await getMessage();
    }
  }

  async _getMessageFromChannel() {
    return this.redis.lpop(this.channelName);
  }
}

module.exports = SubscriberService;
