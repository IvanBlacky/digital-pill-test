const createRedisClient = require("../../common/redis");
const AbstractService = require("../AbstractService");

class PublisherService extends AbstractService {
  constructor(id, channelName = "channel", messagesSource) {
    super(id);

    this.EVENTS = {
      ...this.EVENTS,
    };

    this.redis = createRedisClient();
    this.channelName = channelName;
    this.messagesSource = messagesSource;
    this.newMessageHandler = this.publishMessage.bind(this);
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;

    this.messagesSource.on(
      this.messagesSource.EVENTS.NEW_MESSAGE,
      this.newMessageHandler
    );

    this.messagesSource.start();
  }

  stop() {
    if (!this.isRunning) return;
    this.isRunning = false;

    this.messagesSource.off(
      this.messagesSource.EVENTS.NEW_MESSAGE,
      this.newMessageHandler
    );

    this.messagesSource.stop();
  }

  async publishMessage(message) {
    await this.redis.rpush(this.channelName, message);
  }
}

module.exports = PublisherService;
