const createRedisClient = require("../../common/redis");
const config = require("../../data/config.json");

class Cleaner {
  constructor() {
    this.redis = createRedisClient();
    this.corruptedMessagesList =
      config.corruptedMessagesList || "corruptedMessagesList";
  }

  async clean() {
    let shouldRun;

    // fetch and print messages one by one until the list is empty
    do {
      const reply = await this.redis
        .pipeline()
        .lpop(this.corruptedMessagesList)
        .exec();

      const message = reply[0][1];
      shouldRun = message !== null;

      if (message) console.log(message);
    } while (shouldRun);

    process.exit(0);
  }
}

module.exports = Cleaner;
