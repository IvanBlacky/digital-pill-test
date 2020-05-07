const uuid = require("uuid").v4;

const PubSub = require("./pubsub/PubSub");
const RandomMessagesGenerator = require("./pubsub/MessagesGenerator");
const MessageProcessor = require("./pubsub/processors/MessageProcessor");
const PublisherService = require("./pubsub/PublisherService");
const SubscriberService = require("./pubsub/SubscriberService");
const Cleaner = require("./cleaner/Cleaner");

const config = require("../data/config.json");

class App {
  constructor(mode) {
    // setting a global app id
    this.id = uuid();
    if (!mode) {
      throw "'mode' constructor param is required";
    }

    this.mode = mode;

    switch (this.mode) {
      case App.MODES.PUBSUB:
        this._setupPubSubMode();
        break;
      case App.MODES.CLEANER:
        this._setupCleanerMode();
        break;
    }
  }

  // we need to get these values before instantiating the class -> static getter
  static get MODES() {
    return {
      PUBSUB: "PUBSUB",
      CLEANER: "CLEANER",
    };
  }

  _setupCleanerMode() {
    this.cleaner = new Cleaner();
  }

  _setupPubSubMode() {
    this.messagesGenerator = new RandomMessagesGenerator(
      this.id,
      config.messageGeneratorIntervalMs
    );
    this.messageProcessor = new MessageProcessor(this.id);
    this.pubSub = new PubSub(this.id, config.channelName);
    this.pubService = new PublisherService(
      this.id,
      config.channelName,
      this.messagesGenerator
    );
    this.subService = new SubscriberService(this.id, config.channelName);
    this.pubSub.setPubService(this.pubService);
    this.pubSub.setSubService(this.subService);
    this.pubSub.addProcessor(this.messageProcessor);
    this._subscribeOnErrorEvents();
  }

  start() {
    switch (this.mode) {
      case App.MODES.PUBSUB:
        return this.pubSub.start();
      case App.MODES.CLEANER:
        return this.cleaner.clean();
    }
  }

  stop() {
    switch (this.mode) {
      case App.MODES.PUBSUB:
        this._unsubscribeFromErrorEvents();
        return this.pubSub.stop();
      case App.MODES.CLEANER:
        //no need to stop the cleaner as it will be stopped automatically
        break;
    }
  }

  _subscribeOnErrorEvents() {
    this.errorEventsHandler = this._errorEventsHandler.bind(this);
    this.pubService.on(this.pubService.EVENTS.ERROR, this.errorEventsHandler);
    this.subService.on(this.subService.EVENTS.ERROR, this.errorEventsHandler);
    this.pubSub.on(this.pubSub.EVENTS.ERROR, this.errorEventsHandler);
    this.messagesGenerator.on(
      this.messagesGenerator.EVENTS.ERROR,
      this.errorEventsHandler
    );
    this.messageProcessor.on(
      this.messageProcessor.EVENTS.ERROR,
      this.errorEventsHandler
    );
  }
  _unsubscribeFromErrorEvents() {
    this.pubService.off(this.pubService.EVENTS.ERROR, this.errorEventsHandler);
    this.subService.off(this.subService.EVENTS.ERROR, this.errorEventsHandler);
    this.pubSub.off(this.pubSub.EVENTS.ERROR, this.errorEventsHandler);
    this.messagesGenerator.off(
      this.messagesGenerator.EVENTS.ERROR,
      this.errorEventsHandler
    );
    this.messageProcessor.off(
      this.messageProcessor.EVENTS.ERROR,
      this.errorEventsHandler
    );
  }

  _errorEventsHandler(error) {
    console.error(error);
  }
}

module.exports = App;
