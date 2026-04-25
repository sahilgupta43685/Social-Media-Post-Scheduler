const { getProviderAccount, ensureValidProviderAccessToken } = require("./socialAccountService");

const publishToX = async (post) => {
  const account = await getProviderAccount(post.user, "X");
  const accessToken = await ensureValidProviderAccessToken(account);

  const response = await fetch("https://api.x.com/2/tweets", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ text: post.content })
  });

  const body = await response.text();
  if (!response.ok) {
    account.lastPublishError = `X publish failed (${response.status}): ${body}`;
    if (response.status === 401 || response.status === 403) {
      account.needsReconnect = true;
    }
    await account.save();
    throw new Error(`X publish failed (${response.status}): ${body}`);
  }

  const parsed = body ? JSON.parse(body) : {};
  account.lastPublishAt = new Date();
  account.lastPublishError = null;
  account.needsReconnect = false;
  await account.save();

  return {
    mode: "real-x",
    externalPostId: parsed?.data?.id || null,
    rawResponse: body || null
  };
};

module.exports = { publishToX };
