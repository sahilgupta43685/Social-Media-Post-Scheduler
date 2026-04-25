const simulationPublisher = async (post) => {
  if (post.content.includes("[force-fail]")) {
    throw new Error("Simulated publish failure via [force-fail] marker");
  }

  console.log("=================================");
  console.log("SIMULATED PUBLISH");
  console.log(`Platform: ${post.platform}`);
  console.log(`Post ID: ${post._id}`);
  console.log(`Content: ${post.content}`);
  console.log("=================================");

  return {
    mode: "simulation",
    externalPostId: `sim_${post._id}_${Date.now()}`,
    rawResponse: JSON.stringify({ ok: true, platform: post.platform })
  };
};

module.exports = simulationPublisher;
