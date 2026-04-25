const SocialAccount = require("../models/SocialAccount");
const { decryptToken, encryptToken, getActiveKeyId } = require("./tokenCryptoService");
const { refreshXAccessToken } = require("./xOAuthService");

const isExpired = (dateValue) => {
  if (!dateValue) return false;
  return new Date(dateValue).getTime() <= Date.now();
};

const saveEncryptedAccessToken = (account, accessToken) => {
  const encrypted = encryptToken(accessToken);
  account.accessTokenEncrypted = encrypted.encryptedValue;
  account.accessTokenKeyId = encrypted.keyId;
};

const saveEncryptedRefreshToken = (account, refreshToken) => {
  const encrypted = encryptToken(refreshToken);
  account.refreshTokenEncrypted = encrypted.encryptedValue;
  account.refreshTokenKeyId = encrypted.keyId;
};

const upsertSocialTokens = (account, tokenData) => {
  if (!tokenData.access_token) {
    throw new Error("Missing access_token from provider token response");
  }

  saveEncryptedAccessToken(account, tokenData.access_token);
  if (tokenData.expires_in) {
    account.expiresAt = new Date(Date.now() + tokenData.expires_in * 1000);
  }

  if (tokenData.refresh_token) {
    saveEncryptedRefreshToken(account, tokenData.refresh_token);
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

const rotateEncryptedTokensIfNeeded = async (account) => {
  const activeKeyId = getActiveKeyId();
  let changed = false;

  if (account.accessTokenEncrypted && account.accessTokenKeyId !== activeKeyId) {
    const plain = decryptToken(account.accessTokenEncrypted);
    saveEncryptedAccessToken(account, plain);
    changed = true;
  }

  if (account.refreshTokenEncrypted && account.refreshTokenKeyId !== activeKeyId) {
    const plain = decryptToken(account.refreshTokenEncrypted);
    saveEncryptedRefreshToken(account, plain);
    changed = true;
  }

  if (changed) {
    await account.save();
  }
};

const getProviderAccount = async (userId, provider) => {
  const account = await SocialAccount.findOne({ user: userId, provider });
  if (!account) {
    throw new Error(`${provider} is not connected for this user`);
  }
  await rotateEncryptedTokensIfNeeded(account);
  return account;
};

const ensureValidProviderAccessToken = async (account) => {
  const accessToken = decryptToken(account.accessTokenEncrypted);

  // For providers without refresh token support in this implementation.
  if (account.provider !== "X") {
    return accessToken;
  }

  if (!isExpired(account.expiresAt) || !account.refreshTokenEncrypted) {
    account.needsReconnect = false;
    if (account.isModified("needsReconnect")) {
      await account.save();
    }
    return accessToken;
  }

  if (isExpired(account.refreshTokenExpiresAt)) {
    account.needsReconnect = true;
    account.lastPublishError = "X refresh token expired. Reconnect X.";
    await account.save();
    throw new Error("X token expired. Please reconnect X.");
  }

  try {
    const refreshToken = decryptToken(account.refreshTokenEncrypted);
    const tokenData = await refreshXAccessToken(refreshToken);
    upsertSocialTokens(account, tokenData);
    account.lastRefreshAt = new Date();
    account.needsReconnect = false;
    await account.save();
    return decryptToken(account.accessTokenEncrypted);
  } catch (error) {
    account.needsReconnect = true;
    account.lastPublishError = error.message;
    await account.save();
    throw new Error("X token refresh failed. Please reconnect X.");
  }
};

module.exports = {
  getProviderAccount,
  ensureValidProviderAccessToken,
  upsertSocialTokens
};
