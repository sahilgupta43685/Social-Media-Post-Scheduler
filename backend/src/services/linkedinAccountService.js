const LinkedInAccount = require("../models/LinkedInAccount");
const { decryptToken, encryptToken, getActiveKeyId } = require("./tokenCryptoService");
const { refreshAccessToken } = require("./linkedinOAuthService");

const isExpired = (dateValue) => {
  if (!dateValue) return true;
  return new Date(dateValue).getTime() <= Date.now();
};

const getPlainAccessToken = (account) => {
  if (account.accessTokenEncrypted) {
    return decryptToken(account.accessTokenEncrypted);
  }

  if (account.accessToken) {
    return account.accessToken;
  }

  throw new Error("No LinkedIn access token available");
};

const getPlainRefreshToken = (account) => {
  if (!account.refreshTokenEncrypted) return null;
  return decryptToken(account.refreshTokenEncrypted);
};

const upsertLinkedInTokens = async (account, tokenData) => {
  if (!tokenData.access_token) {
    throw new Error("Missing access_token from LinkedIn token response");
  }

  const access = encryptToken(tokenData.access_token);
  account.accessTokenEncrypted = access.encryptedValue;
  account.accessTokenKeyId = access.keyId;
  account.accessToken = null;
  account.expiresAt = new Date(Date.now() + tokenData.expires_in * 1000);

  if (tokenData.refresh_token) {
    const refresh = encryptToken(tokenData.refresh_token);
    account.refreshTokenEncrypted = refresh.encryptedValue;
    account.refreshTokenKeyId = refresh.keyId;
  }

  if (tokenData.refresh_token_expires_in) {
    account.refreshTokenExpiresAt = new Date(
      Date.now() + tokenData.refresh_token_expires_in * 1000
    );
  }

  if (tokenData.scope) {
    account.scope = tokenData.scope;
  }
};

const rotateStoredTokensIfNeeded = async (account) => {
  const activeKeyId = getActiveKeyId();
  let changed = false;

  if (account.accessToken && !account.accessTokenEncrypted) {
    const encrypted = encryptToken(account.accessToken);
    account.accessTokenEncrypted = encrypted.encryptedValue;
    account.accessTokenKeyId = encrypted.keyId;
    account.accessToken = null;
    changed = true;
  } else if (account.accessTokenEncrypted && account.accessTokenKeyId !== activeKeyId) {
    const plain = decryptToken(account.accessTokenEncrypted);
    const encrypted = encryptToken(plain);
    account.accessTokenEncrypted = encrypted.encryptedValue;
    account.accessTokenKeyId = encrypted.keyId;
    changed = true;
  }

  if (account.refreshTokenEncrypted && account.refreshTokenKeyId !== activeKeyId) {
    const plain = decryptToken(account.refreshTokenEncrypted);
    const encrypted = encryptToken(plain);
    account.refreshTokenEncrypted = encrypted.encryptedValue;
    account.refreshTokenKeyId = encrypted.keyId;
    changed = true;
  }

  if (changed) {
    await account.save();
  }
};

const ensureValidLinkedInAccessToken = async (account) => {
  await rotateStoredTokensIfNeeded(account);

  // Early return if token is not close to expiry (60s safety window).
  if (account.expiresAt && new Date(account.expiresAt).getTime() > Date.now() + 60_000) {
    account.needsReconnect = false;
    if (account.isModified("needsReconnect")) {
      await account.save();
    }
    return getPlainAccessToken(account);
  }

  const refreshToken = getPlainRefreshToken(account);
  if (!refreshToken || isExpired(account.refreshTokenExpiresAt)) {
    account.needsReconnect = true;
    account.lastPublishError = "LinkedIn token expired and no valid refresh token is available";
    await account.save();
    throw new Error("LinkedIn token expired. Please reconnect LinkedIn.");
  }

  try {
    const tokenData = await refreshAccessToken(refreshToken);
    await upsertLinkedInTokens(account, tokenData);
    account.lastRefreshAt = new Date();
    account.needsReconnect = false;
    await account.save();
    return getPlainAccessToken(account);
  } catch (error) {
    account.needsReconnect = true;
    account.lastPublishError = error.message;
    await account.save();
    throw new Error("LinkedIn token refresh failed. Please reconnect LinkedIn.");
  }
};

module.exports = {
  ensureValidLinkedInAccessToken,
  upsertLinkedInTokens
};
