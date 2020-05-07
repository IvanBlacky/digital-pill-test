const createRedisClient = require("../../../common/redis");
const AbstractService = require("../../AbstractService");
const config = require("../../../data/config.json");

class MessageProcessor extends AbstractService {
  constructor(id) {
    super(id);
    this.EVENTS = {
      ...this.EVENTS,
      MESSAGE_PROCESSED: "MESSAGE PROCESSED",
      MESSAGE_CORRUPTED: "MESSAGE CORRUPTED",
    };

    this.redis = createRedisClient();
    this.corruptedMessagesList =
      config.corruptedMessagesList || "corruptedMessagesList";
  }

  async processMessage(message) {
    if (this._isCorrupted(message)) {
      await this.redis.rpush(
        this.corruptedMessagesList,
        JSON.stringify({
          originalMessage: message,
          serviceId: this.id,
          processedAt: new Date(),
        })
      );
      this.emit(this.EVENTS.MESSAGE_CORRUPTED);
    } else {
      this.emit(this.EVENTS.MESSAGE_PROCESSED);
    }
  }

  _isCorrupted(message) {
    // 5% chance of corrupted message emulation
    return Math.random() <= 0.05;
  }
}

module.exports = MessageProcessor;
