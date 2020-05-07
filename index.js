const App = require("./services/App");
const config = require("./data/config.json");

async function main() {
  // getting node process args excluding first two which are unused
  const argv = process.argv.slice(2);

  // setting default mode: pub/sub
  let mode = App.MODES.PUBSUB;

  // process args have flag for cleaning errors (--getErrors bu default) -> set mode to cleaner mode
  if (argv.includes(config.cleanerModeArg)) mode = App.MODES.CLEANER;

  // instantiate and run app
  const app = new App(mode);
  await app.start();
}

main().catch((err) => {
  console.error("Unhandled error --", err);
  process.exit(1);
});
