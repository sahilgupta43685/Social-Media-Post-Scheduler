const { getProviderAccount, ensureValidProviderAccessToken } = require("./socialAccountService");

const publishToInstagram = async (post) => {
  const account = await getProviderAccount(post.user, "Instagram");
  const accessToken = await ensureValidProviderAccessToken(account);
  const igUserId = account.metadata?.igUserId;
  const defaultImageUrl = process.env.INSTAGRAM_DEFAULT_IMAGE_URL;

  if (!igUserId) {
    throw new Error("Instagram business account is not configured. Reconnect Instagram.");
  }

  if (!defaultImageUrl) {
    throw new Error("Missing INSTAGRAM_DEFAULT_IMAGE_URL in .env for Instagram publishing.");
  }

  // Instagram content publishing requires media. We publish a single image post with caption.
  const createContainerParams = new URLSearchParams({
    image_url: defaultImageUrl,
    caption: post.content,
    access_token: accessToken
  });

  const createResponse = await fetch(`https://graph.facebook.com/v23.0/${igUserId}/media`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: createContainerParams
  });

  const createBody = await createResponse.text();
  if (!createResponse.ok) {
    account.lastPublishError = `Instagram container failed (${createResponse.status}): ${createBody}`;
    if (createResponse.status === 401 || createResponse.status === 403) {
      account.needsReconnect = true;
    }
    await account.save();
    throw new Error(`Instagram container failed (${createResponse.status}): ${createBody}`);
  }

  const createParsed = createBody ? JSON.parse(createBody) : {};
  const creationId = createParsed.id;
  if (!creationId) {
    throw new Error("Instagram container ID missing from response");
  }

  const publishParams = new URLSearchParams({
    creation_id: creationId,
    access_token: accessToken
  });

  const publishResponse = await fetch(`https://graph.facebook.com/v23.0/${igUserId}/media_publish`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: publishParams
  });

  const publishBody = await publishResponse.text();
  if (!publishResponse.ok) {
    account.lastPublishError = `Instagram publish failed (${publishResponse.status}): ${publishBody}`;
    if (publishResponse.status === 401 || publishResponse.status === 403) {
      account.needsReconnect = true;
    }
    await account.save();
    throw new Error(`Instagram publish failed (${publishResponse.status}): ${publishBody}`);
  }

  const publishParsed = publishBody ? JSON.parse(publishBody) : {};
  account.lastPublishAt = new Date();
  account.lastPublishError = null;
  account.needsReconnect = false;
  await account.save();

  return {
    mode: "real-instagram",
    externalPostId: publishParsed.id || creationId,
    rawResponse: publishBody || null
  };
};

module.exports = { publishToInstagram };
