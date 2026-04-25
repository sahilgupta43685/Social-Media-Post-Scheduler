const { getProviderAccount, ensureValidProviderAccessToken } = require("./socialAccountService");

const publishToFacebook = async (post) => {
  const account = await getProviderAccount(post.user, "Facebook");
  const accessToken = await ensureValidProviderAccessToken(account);
  const pageId = account.metadata?.pageId;

  if (!pageId) {
    throw new Error("Facebook page is not configured. Reconnect Facebook.");
  }

  const params = new URLSearchParams({
    message: post.content,
    access_token: accessToken
  });

  const response = await fetch(`https://graph.facebook.com/v23.0/${pageId}/feed`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: params
  });

  const body = await response.text();
  if (!response.ok) {
    account.lastPublishError = `Facebook publish failed (${response.status}): ${body}`;
    if (response.status === 401 || response.status === 403) {
      account.needsReconnect = true;
    }
    await account.save();
    throw new Error(`Facebook publish failed (${response.status}): ${body}`);
  }

  const parsed = body ? JSON.parse(body) : {};
  account.lastPublishAt = new Date();
  account.lastPublishError = null;
  account.needsReconnect = false;
  await account.save();

  return {
    mode: "real-facebook",
    externalPostId: parsed.id || null,
    rawResponse: body || null
  };
};

module.exports = { publishToFacebook };
