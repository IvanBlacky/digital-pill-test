const Redis = require("ioredis");
const config = require("../data/config.json");

function createRedisClient() {
  // returning an instance of ioredis client, so we can have many clients with same params in the whole app
  return new Redis({
    host: config.redisHost || "localhost",
    port: config.redisPort || 6379,
    family: 4, // IPv4
    password: config.redisPassword || null,
    db: config.redisDb || 0,
  });
}

module.exports = createRedisClient;
