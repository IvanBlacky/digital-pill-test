const randomString = require("random-string");
const AbstractService = require("../AbstractService");

class RandomMessageGenerator extends AbstractService {
  constructor(id, messageGenerationInterval = 500) {
    super(id);
    this.EVENTS = {
      ...this.EVENTS,
      NEW_MESSAGE: "NEW MESSAGE",
    };
    this.messageGenerationInterval = messageGenerationInterval;
  }

  generateMessage() {
    return JSON.stringify({
      message: randomString({ length: 20 }),
      serviceId: this.id,
    });
  }

  generateMessageAndNotify() {
    const message = this.generateMessage();
    this.emit(this.EVENTS.NEW_MESSAGE, message);
  }

  start() {
    if (this.isRunning) return;

    this.interval = setInterval(
      this.generateMessageAndNotify.bind(this),
      this.messageGenerationInterval
    );
    this.isRunning = true;
  }

  stop() {
    clearInterval(this.interval);
    this.isRunning = false;
  }
}

module.exports = RandomMessageGenerator;
