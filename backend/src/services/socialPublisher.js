const simulatedApiCall = async (platform, content) => {
  await new Promise((resolve) => setTimeout(resolve, 500));
  return `${platform.toLowerCase()}_${Date.now()}`;
};

const publishToX = async (post) => simulatedApiCall("X", post.content);
const publishToInstagram = async (post) => simulatedApiCall("Instagram", post.content);
const publishToLinkedIn = async (post) => simulatedApiCall("LinkedIn", post.content);
const publishToFacebook = async (post) => simulatedApiCall("Facebook", post.content);

const publishPostToPlatform = async (post) => {
  if (process.env.SIMULATE_SOCIAL === "true") {
    if (post.platform === "X") return publishToX(post);
    if (post.platform === "Instagram") return publishToInstagram(post);
    if (post.platform === "LinkedIn") return publishToLinkedIn(post);
    if (post.platform === "Facebook") return publishToFacebook(post);
    throw new Error("Unsupported platform");
  }

  throw new Error("Real platform API mode not configured yet");
};

module.exports = { publishPostToPlatform };
