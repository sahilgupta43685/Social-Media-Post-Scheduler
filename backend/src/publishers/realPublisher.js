const simulationPublisher = require("./simulationPublisher");
const { publishToLinkedIn } = require("../services/linkedinPublisher");
const { publishToX } = require("../services/xPublisher");
const { publishToFacebook } = require("../services/facebookPublisher");
const { publishToInstagram } = require("../services/instagramPublisher");

const realPublisher = async (post) => {
  if (post.platform === "LinkedIn") {
    return publishToLinkedIn(post);
  }

  if (post.platform === "X") {
    return publishToX(post);
  }

  if (post.platform === "Facebook") {
    return publishToFacebook(post);
  }

  if (post.platform === "Instagram") {
    return publishToInstagram(post);
  }

  return simulationPublisher(post);
};

module.exports = realPublisher;
