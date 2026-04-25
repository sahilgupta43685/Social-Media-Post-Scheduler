const LinkedInAccount = require("../models/LinkedInAccount");
const { ensureValidLinkedInAccessToken } = require("./linkedinAccountService");

const publishToLinkedIn = async (post) => {
  const account = await LinkedInAccount.findOne({ user: post.user });
  if (!account) {
    throw new Error("LinkedIn not connected for this user");
  }

  const accessToken = await ensureValidLinkedInAccessToken(account);

  const payload = {
    author: account.authorUrn,
    commentary: post.content,
    visibility: "PUBLIC",
    distribution: {
      feedDistribution: "MAIN_FEED",
      targetEntities: [],
      thirdPartyDistributionChannels: []
    },
    lifecycleState: "PUBLISHED",
    isReshareDisabledByAuthor: false
  };

  const response = await fetch("https://api.linkedin.com/rest/posts", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "X-Restli-Protocol-Version": "2.0.0",
      "LinkedIn-Version": process.env.LINKEDIN_VERSION || "202604"
    },
    body: JSON.stringify(payload)
  });

  const text = await response.text();
  if (!response.ok) {
    account.lastPublishError = `LinkedIn post failed (${response.status}): ${text}`;
    if (response.status === 401 || response.status === 403) {
      account.needsReconnect = true;
    }
    await account.save();
    throw new Error(`LinkedIn post failed (${response.status}): ${text}`);
  }

  account.lastPublishAt = new Date();
  account.lastPublishError = null;
  account.needsReconnect = false;
  await account.save();

  return {
    mode: "real-linkedin",
    externalPostId: response.headers.get("x-restli-id") || null,
    rawResponse: text || null
  };
};

module.exports = { publishToLinkedIn };
