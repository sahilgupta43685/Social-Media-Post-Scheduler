const simulationPublisher = require("./simulationPublisher");
const webhookPublisher = require("./webhookPublisher");
const realPublisher = require("./realPublisher");

const publishPost = async (post) => {
  const mode = (process.env.PUBLISH_MODE || "simulation").toLowerCase();

  if (mode === "simulation") return simulationPublisher(post);
  if (mode === "webhook") return webhookPublisher(post);
  if (mode === "real") return realPublisher(post);

  throw new Error(`Invalid PUBLISH_MODE: ${mode}`);
};

module.exports = { publishPost };
